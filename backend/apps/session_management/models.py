import uuid
from django.db import models
from apps.authentication.models import UserProfile
from apps.counselor_profiles.models import CounselorProfile


class CounselingSession(models.Model):
    """
    A single interaction between a client and a counselor (or AI listener).
    Tracks session type, encryption status, duration, and billing.
    At session end, calming music is played and all audio is E2EE — zero server recording.
    """
    SESSION_TYPE = [
        ("AI_TRIAGE", "AI Listener (Immediately Baat)"),
        ("VOICE_CALL", "E2EE Encrypted Voice Call"),
        ("TEXT_CHAT", "Text-Based Chat Session"),
        ("IN_PERSON", "In-Person Meeting"),
    ]
    SESSION_STATUS = [
        ("REQUESTED", "Requested — Awaiting Counselor"),
        ("ACTIVE", "Active — In Session"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]
    PAYMENT_STATUS = [
        ("FREE", "Free Session"),
        ("PENDING", "Payment Pending"),
        ("PAID", "Payment Received"),
        ("REFUNDED", "Refunded"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="sessions_as_client")
    counselor = models.ForeignKey(
        CounselorProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="sessions_as_counselor",
        help_text="Null for AI_TRIAGE sessions where no human counselor is involved"
    )
    session_type = models.CharField(max_length=16, choices=SESSION_TYPE, default="AI_TRIAGE")
    status = models.CharField(max_length=16, choices=SESSION_STATUS, default="REQUESTED")
    language_used = models.CharField(max_length=32, default="English", help_text="Language of the session")
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    amount_charged = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_status = models.CharField(max_length=16, choices=PAYMENT_STATUS, default="FREE")
    is_encrypted = models.BooleanField(
        default=True,
        help_text="E2EE via DTLS-SRTP — phone numbers masked, zero server-side audio recording"
    )
    session_notes_encrypted = models.TextField(
        blank=True,
        help_text="Counselor's private post-session notes (encrypted at rest)"
    )
    calming_music_played = models.BooleanField(
        default=False,
        help_text="Whether soothing ambient music was played at session conclusion"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Counseling Session"
        verbose_name_plural = "Counseling Sessions"
        ordering = ["-created_at"]

    def __str__(self):
        counselor_name = self.counselor.display_name if self.counselor else "AI Listener"
        return f"{self.session_type} | {self.client.full_name} → {counselor_name} ({self.status})"


class SavedConnection(models.Model):
    """
    A bookmarked counselor or peer that the user wants to reconnect with easily.
    Maps to the 'Person in Contact' and 'Connect to the fav stranger' features.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="saved_connections")
    saved_counselor = models.ForeignKey(
        CounselorProfile, on_delete=models.CASCADE, null=True, blank=True,
        related_name="bookmarked_by", help_text="Saved counselor for easy re-booking"
    )
    saved_peer = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, null=True, blank=True,
        related_name="saved_as_peer", help_text="Saved peer/stranger for reconnection"
    )
    nickname = models.CharField(max_length=128, blank=True, help_text="Personal label for this connection")
    connected_since = models.DateTimeField(auto_now_add=True)
    last_session_date = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Saved Connection"
        verbose_name_plural = "Saved Connections"

    def __str__(self):
        target = self.saved_counselor.display_name if self.saved_counselor else (self.saved_peer.full_name if self.saved_peer else "Unknown")
        return f"{self.user.full_name} → {target}"


class SessionRequest(models.Model):
    """
    Client session booking requests to counselors or peer listeners.
    Supports full lifecycle: pending, accepted, declined, cancelled.
    """
    REQUEST_STATUS = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
        ("cancelled", "Cancelled"),
    ]
    COMM_MODE = [
        ("chat", "Chat"),
        ("voice", "Voice"),
        ("video", "Video"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="requests_sent")
    provider_id = models.CharField(max_length=128)
    provider_name = models.CharField(max_length=255)
    topic = models.CharField(max_length=255, default="Just need to talk")
    context = models.TextField(blank=True)
    mode = models.CharField(max_length=16, choices=COMM_MODE, default="chat")
    status = models.CharField(max_length=16, choices=REQUEST_STATUS, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Session Request"
        verbose_name_plural = "Session Requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.client.full_name} → {self.provider_name} [{self.status}]"


