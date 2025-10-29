import os
import tempfile
import whisper
from typing import Optional, Dict, Any
from pydantic import BaseModel
from supabase import Client
import json
from datetime import datetime
import openai
from openai import OpenAI

class VoiceContextRequest(BaseModel):
    user_id: str
    category: str = "general"  # general, linkedin, company, personal, etc.
    
class VoiceContextResponse(BaseModel):
    id: str
    transcription: str
    summary: str
    category: str
    created_at: str

class VoiceService:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.whisper_model = None
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    def _load_whisper_model(self):
        """Lazy load Whisper model to save memory"""
        if self.whisper_model is None:
            print("Loading Whisper model...")
            self.whisper_model = whisper.load_model("base")  # base model is good balance of speed/accuracy
        return self.whisper_model
    
    async def transcribe_audio(self, audio_file_path: str) -> str:
        """Transcribe audio file to text using Whisper"""
        try:
            model = self._load_whisper_model()
            result = model.transcribe(audio_file_path)
            return result["text"].strip()
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")
    
    async def summarize_and_categorize(self, transcription: str, category: str = "general") -> Dict[str, str]:
        """Use OpenAI to summarize and extract key context from transcription"""
        try:
            prompt = f"""
            Please analyze this voice transcription and provide a structured summary for context enrichment:
            
            Transcription: "{transcription}"
            Category: {category}
            
            Please provide:
            1. A concise summary (2-3 sentences)
            2. Key topics/themes mentioned
            3. Any actionable insights or preferences
            4. Relevant context for content generation
            
            Format your response as JSON with keys: summary, key_topics, insights, context
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse as JSON, fallback to simple summary if parsing fails
            try:
                parsed = json.loads(content)
                return {
                    "summary": parsed.get("summary", transcription[:200] + "..."),
                    "key_topics": parsed.get("key_topics", ""),
                    "insights": parsed.get("insights", ""),
                    "context": parsed.get("context", "")
                }
            except json.JSONDecodeError:
                # Fallback to simple summary
                return {
                    "summary": content[:200] + "..." if len(content) > 200 else content,
                    "key_topics": "",
                    "insights": "",
                    "context": content
                }
                
        except Exception as e:
            # Fallback to original transcription if OpenAI fails
            return {
                "summary": transcription[:200] + "..." if len(transcription) > 200 else transcription,
                "key_topics": "",
                "insights": "",
                "context": transcription
            }
    
    async def store_voice_context(self, user_id: str, transcription: str, category: str = "general") -> Dict[str, Any]:
        """Store voice context in database with AI-generated summary"""
        try:
            # Generate summary and context
            ai_analysis = await self.summarize_and_categorize(transcription, category)
            
            # Store in database
            voice_context_data = {
                "user_id": user_id,
                "transcription": transcription,
                "summary": ai_analysis["summary"],
                "key_topics": ai_analysis["key_topics"],
                "insights": ai_analysis["insights"],
                "context": ai_analysis["context"],
                "category": category,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('voice_contexts').insert(voice_context_data).execute()
            
            if result.data:
                return {
                    "success": True,
                    "id": result.data[0]["id"],
                    "transcription": transcription,
                    "summary": ai_analysis["summary"],
                    "category": category,
                    "created_at": result.data[0]["created_at"]
                }
            else:
                raise Exception("Failed to store voice context")
                
        except Exception as e:
            raise Exception(f"Failed to store voice context: {str(e)}")
    
    async def get_user_voice_contexts(self, user_id: str, category: Optional[str] = None, limit: int = 10) -> list:
        """Retrieve user's voice contexts, optionally filtered by category"""
        try:
            query = self.supabase.table('voice_contexts').select('*').eq('user_id', user_id)
            
            if category:
                query = query.eq('category', category)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            raise Exception(f"Failed to retrieve voice contexts: {str(e)}")
    
    async def get_context_for_generation(self, user_id: str, categories: Optional[list] = None) -> str:
        """Get consolidated context from voice inputs for content generation"""
        try:
            query = self.supabase.table('voice_contexts').select('summary, key_topics, insights, context, category').eq('user_id', user_id)
            
            if categories:
                query = query.in_('category', categories)
            
            result = query.order('created_at', desc=True).limit(20).execute()
            
            if not result.data:
                return ""
            
            # Consolidate contexts into a coherent summary
            contexts = []
            for item in result.data:
                context_text = f"[{item['category'].upper()}] {item['summary']}"
                if item['key_topics']:
                    context_text += f" Key topics: {item['key_topics']}"
                if item['insights']:
                    context_text += f" Insights: {item['insights']}"
                contexts.append(context_text)
            
            return "\n\n".join(contexts)
            
        except Exception as e:
            return f"Error retrieving context: {str(e)}"
