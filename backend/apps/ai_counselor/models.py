import uuid
from django.db import models
from apps.authentication.models import UserProfile


class CounselorChatMessage(models.Model):
    """
    Conversation between a user and the AI Counselor.
    Messages are routed through 5 specialized counseling engines
    based on the user's emotional state and immediate need.
    """
    MESSAGE_ROLE = [
        ("user", "User (Person Seeking Help)"),
        ("assistant", "AI Counselor"),
        ("system", "System Routing"),
    ]
    COUNSELING_ENGINE = [
        ("empathy_listener", "💜 Empathy & Active Listening"),
        ("mood_triage", "🌡️ Mood Assessment & Triage"),
        ("crisis_handler", "🚨 Crisis De-Escalation"),
        ("provider_router", "🔍 Counselor Matching & Routing"),
        ("wellness_guide", "🧘 Wellness Assignment Guide"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="counselor_messages")
    role = models.CharField(max_length=16, choices=MESSAGE_ROLE)
    content = models.TextField(help_text="Message body")
    engine_routed = models.CharField(
        max_length=64, choices=COUNSELING_ENGINE, default="empathy_listener",
        help_text="Which AI counseling engine processed this message"
    )
    context_snapshot = models.JSONField(
        default=dict, blank=True,
        help_text="User's mood level, active session info, and routing metadata at time of message"
    )
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_messages"
        verbose_name = "Counselor Chat Message"
        verbose_name_plural = "Counselor Chat Messages"
        ordering = ["sent_at"]

    def __str__(self):
        return f"[{self.role.upper()} via {self.get_engine_routed_display()}]: {self.content[:45]}..."
