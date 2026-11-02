import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.authentication.models import UserProfile


class CounselorProfile(models.Model):
    """
    Extended profile for verified counselors/therapists on the platform.
    Contains credentials, languages spoken, pricing, availability status,
    and a personal story that helps clients trust before connecting.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name="counselor_profile")
    display_name = models.CharField(max_length=255, help_text="Professional name shown to clients")
    profile_photo_url = models.URLField(blank=True, help_text="Hosted profile picture URL")
    personal_story = models.TextField(
        help_text="Human story that builds empathy and trust before a client connects"
    )
    qualification = models.CharField(max_length=255, help_text="e.g. M.A. Clinical Psychology, MBBS Psychiatry")
    license_number = models.CharField(max_length=128, blank=True, help_text="Professional license or registration ID")
    specialties = models.JSONField(
        default=list,
        help_text='List of expertise areas, e.g. ["Anxiety", "Trauma", "Relationships", "Grief"]'
    )
    languages_spoken = models.JSONField(
        default=list,
        help_text='Languages this counselor can conduct sessions in, e.g. ["Hindi", "English", "Tamil"]'
    )
    years_of_experience = models.PositiveIntegerField(default=1)
    rate_per_minute = models.DecimalField(
        max_digits=8, decimal_places=2, default=15.00,
        help_text="Charge per minute for voice/text sessions (₹)"
    )
    rate_per_hour = models.DecimalField(
        max_digits=8, decimal_places=2, default=500.00,
        help_text="Charge per hour for extended sessions (₹)"
    )
    is_verified = models.BooleanField(default=False, help_text="Platform-verified credentials")
    is_available_now = models.BooleanField(
        default=False,
        help_text="Real-time online status — shown as 'Online Now' to clients"
    )
    total_sessions_completed = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0.00,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text="Aggregate star rating from client reviews (0-5)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Counselor Profile"
        verbose_name_plural = "Counselor Profiles"
        ordering = ["-average_rating", "-total_sessions_completed"]

    def __str__(self):
        return f"{self.display_name} ({', '.join(self.languages_spoken)}) — ₹{self.rate_per_minute}/min"


class CounselorReview(models.Model):
    """
    Post-session review left by a client for a counselor.
    Feeds into the counselor's aggregate rating and trust score.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    counselor = models.ForeignKey(CounselorProfile, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="reviews_given")
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Star rating from 1 (poor) to 5 (excellent)"
    )
    review_text = models.TextField(blank=True, help_text="Optional written feedback")
    session_date = models.DateField(help_text="Date of the reviewed session")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Counselor Review"
        verbose_name_plural = "Counselor Reviews"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{'⭐' * self.rating} for {self.counselor.display_name} ({self.session_date})"

