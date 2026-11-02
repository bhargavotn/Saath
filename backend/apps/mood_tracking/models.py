import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.authentication.models import UserProfile


class MoodCheckIn(models.Model):
    """
    Instant mood snapshot when a user enters the platform.
    Powers the 'Immediately Baat' feature — the AI listener acknowledges
    the user's emotional state and provides immediate comfort before
    optionally routing to a human counselor.
    """
    MOOD_LABEL = [
        ("DISTRESSED", "Distressed — Need help now"),
        ("ANXIOUS", "Anxious — Feeling uneasy"),
        ("SAD", "Sad — Feeling down"),
        ("NEUTRAL", "Neutral — Just checking in"),
        ("CALM", "Calm — Feeling at peace"),
        ("HOPEFUL", "Hopeful — Getting better"),
        ("HAPPY", "Happy — Doing well"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="mood_checkins")
    check_in_time = models.DateTimeField(auto_now_add=True)
    mood_level = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Self-reported emotional intensity from 1 (crisis) to 10 (thriving)"
    )
    mood_label = models.CharField(max_length=16, choices=MOOD_LABEL, default="NEUTRAL")
    trigger_description = models.TextField(
        blank=True,
        help_text="Optional: what triggered this mood (e.g. 'fight with family', 'work pressure')"
    )
    ai_acknowledgment_response = models.TextField(
        blank=True,
        help_text="The AI listener's empathetic response to this mood check-in"
    )
    routed_to_human = models.BooleanField(
        default=False,
        help_text="True if AI triage determined this user needs immediate human counselor"
    )

    class Meta:
        verbose_name = "Mood Check-In"
        verbose_name_plural = "Mood Check-Ins"
        ordering = ["-check_in_time"]

    def __str__(self):
        return f"{self.user.full_name} — {self.get_mood_label_display()} (Level: {self.mood_level}/10)"


class WellnessAssignment(models.Model):
    """
    Guided self-care activities assigned by the AI counselor after a mood check-in.
    Provides actionable exercises to help the user stabilize their emotional state.
    """
    ASSIGNMENT_TYPE = [
        ("BREATHING", "Breathing Exercise (4-7-8 Technique)"),
        ("JOURNALING", "Journaling Prompt"),
        ("GRATITUDE", "Gratitude List"),
        ("BODY_SCAN", "Body Scan Meditation"),
        ("GROUNDING", "5-4-3-2-1 Grounding Technique"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="wellness_assignments")
    assigned_date = models.DateTimeField(auto_now_add=True)
    assignment_type = models.CharField(max_length=16, choices=ASSIGNMENT_TYPE, default="BREATHING")
    instructions = models.TextField(help_text="Step-by-step guidance for this wellness activity")
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Wellness Assignment"
        verbose_name_plural = "Wellness Assignments"
        ordering = ["-assigned_date"]

    def __str__(self):
        done = "✓ Done" if self.is_completed else "⏳ Pending"
        return f"{self.get_assignment_type_display()} for {self.user.full_name} — {done}"

