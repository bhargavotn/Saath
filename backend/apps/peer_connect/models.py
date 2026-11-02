


import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.authentication.models import UserProfile


class CompatibilityAssessment(models.Model):
    """
    Anti-AI verification quiz + compatibility profiling.
    Users complete MCQ questions — the system verifies if responses are
    human-generated (not AI-written) and computes a compatibility vector
    for peer matching.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="assessments")
    assessment_date = models.DateTimeField(auto_now_add=True)
    mcq_responses = models.JSONField(
        default=dict,
        help_text="Structured MCQ answers: {question_id: selected_option, ...}"
    )
    is_human_verified = models.BooleanField(
        default=False,
        help_text="True if anti-AI detection confirms responses are genuinely human-written"
    )
    compatibility_vector = models.JSONField(
        default=list,
        help_text="Computed personality/need vector used for peer matching algorithm"
    )
    mood_snapshot = models.CharField(
        max_length=64, blank=True,
        help_text="Self-reported mood at assessment time (e.g. Anxious, Lonely, Curious)"
    )

    class Meta:
        verbose_name = "Compatibility Assessment"
        verbose_name_plural = "Compatibility Assessments"
        ordering = ["-assessment_date"]

    def __str__(self):
        verified = "✓ Human" if self.is_human_verified else "⚠ Unverified"
        return f"{self.user.full_name} — {verified} ({self.assessment_date.date()})"


class PeerMatch(models.Model):
    """
    Two users matched for anonymous peer support conversation.
    Compatibility score is computed from both users' assessment vectors.
    """
    MATCH_STATUS = [
        ("PENDING", "Pending Acceptance"),
        ("ACTIVE", "Active Connection"),
        ("ENDED", "Connection Ended"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_one = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="matches_initiated")
    user_two = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="matches_received")
    compatibility_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.00,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="How well these two users are matched (0-100%)"
    )
    match_language = models.CharField(
        max_length=32, default="English",
        help_text="Common language for this peer connection"
    )
    matched_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=16, choices=MATCH_STATUS, default="PENDING")

    class Meta:
        verbose_name = "Peer Match"
        verbose_name_plural = "Peer Matches"
        ordering = ["-matched_at"]

    def __str__(self):
        return f"{self.user_one.full_name} ↔ {self.user_two.full_name} ({self.compatibility_score}%)"


class CommunityRoom(models.Model):
    """
    Open community rooms where people can freely talk and connect.
    Supports free-tier voice/text rooms, support groups, and language-specific rooms.
    """
    ROOM_TYPE = [
        ("FREE_TALK", "Free Talk — Open Conversation"),
        ("SUPPORT_GROUP", "Support Group — Guided Topic"),
        ("LANGUAGE_ROOM", "Language Room — Regional Connect"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_name = models.CharField(max_length=128)
    domain = models.CharField(max_length=128, default="Support")
    emoji = models.CharField(max_length=16, default="💬")
    description = models.TextField(blank=True)
    ground_rules = models.TextField(blank=True)
    host = models.CharField(max_length=128, default="Peer Moderator")
    room_type = models.CharField(max_length=16, choices=ROOM_TYPE, default="FREE_TALK")
    language = models.CharField(max_length=32, default="English")
    active_participants_count = models.PositiveIntegerField(default=5)
    max_participants = models.PositiveIntegerField(default=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Community Room"
        verbose_name_plural = "Community Rooms"

    def __str__(self):
        status = "🟢 Active" if self.is_active else "🔴 Closed"
        return f"{self.room_name} [{self.language}] — {status}"


class ClinicalAssessmentRecord(models.Model):
    """
    Stores complete historical records of evaluated clinical assessments (PHQ-9 + GAD-7 + Maslach).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="assessment_history")
    total_score = models.IntegerField()
    max_score = models.IntegerField(default=27)
    severity = models.CharField(max_length=64)
    clinical_tier = models.CharField(max_length=64)
    anxiety_score = models.IntegerField()
    depression_score = models.IntegerField()
    burnout_score = models.IntegerField()
    interpretation = models.TextField()
    recommendation = models.TextField()
    matched_counselor = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Clinical Assessment Record"
        verbose_name_plural = "Clinical Assessment Records"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.full_name} — Score: {self.total_score}/27 ({self.severity})"

