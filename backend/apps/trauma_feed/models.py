import uuid
from django.db import models
from apps.authentication.models import UserProfile


class TraumaStory(models.Model):
    """
    Anonymous vulnerability stories shared in the Safe Trauma Feed.
    CRITICAL DESIGN RULE: There is NO comment or reply model.
    Users can only read, send a silent support reaction, and leave.
    This prevents cyberbullying and unsolicited advice.
    """
    STORY_CATEGORY = [
        ("ANXIETY", "Anxiety & Panic"),
        ("GRIEF", "Grief & Loss"),
        ("RELATIONSHIP", "Relationship & Heartbreak"),
        ("LONELINESS", "Loneliness & Isolation"),
        ("WORKPLACE", "Workplace Stress & Burnout"),
        ("FAMILY", "Family Conflict"),
        ("OTHER", "Other / General"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="trauma_stories")
    content = models.TextField(help_text="The raw, honest story — shared to heal, not to be judged")
    is_anonymous = models.BooleanField(
        default=True,
        help_text="When True, author identity is completely hidden"
    )
    anonymous_alias = models.CharField(
        max_length=64, blank=True,
        help_text="System-generated alias like 'Brave Soul #4281' shown when anonymous"
    )
    language = models.CharField(max_length=32, default="English")
    category = models.CharField(max_length=16, choices=STORY_CATEGORY, default="OTHER")
    support_reaction_count = models.PositiveIntegerField(
        default=0,
        help_text="Total silent support reactions (hearts, strength, hugs) — no comments allowed"
    )
    is_premium_content = models.BooleanField(
        default=False,
        help_text="Premium stories are visible only to subscribed users"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Trauma Story"
        verbose_name_plural = "Trauma Stories (Read-Only Feed)"
        ordering = ["-created_at"]

    def __str__(self):
        name = self.anonymous_alias if self.is_anonymous else self.author.full_name
        return f"[{self.category}] {name}: {self.content[:50]}..."


class SupportReaction(models.Model):
    """
    Silent empathy reactions on trauma stories.
    No text replies — only predefined emotional support gestures.
    """
    REACTION_TYPE = [
        ("HEART", "❤️ Heart — I feel you"),
        ("STRENGTH", "💪 Strength — You are strong"),
        ("HUG", "🤗 Hug — Sending warmth"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(TraumaStory, on_delete=models.CASCADE, related_name="reactions")
    reactor = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="reactions_given")
    reaction_type = models.CharField(max_length=16, choices=REACTION_TYPE, default="HEART")
    reacted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Support Reaction"
        verbose_name_plural = "Support Reactions"
        unique_together = ("story", "reactor")  # One reaction per user per story

    def __str__(self):
        return f"{self.get_reaction_type_display()} on '{self.story.content[:30]}...'"

