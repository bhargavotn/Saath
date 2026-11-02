import uuid
from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class UserProfile(models.Model):
    """
    Every person on the platform — whether they are seeking help (client),
    offering help (counselor), or managing the system (admin).
    Phone numbers are stored encrypted — never shown in plaintext to other users.
    """
    USER_TYPE = [
        ("CLIENT", "Client (Seeking Help)"),
        ("COUNSELOR", "Counselor (Providing Help)"),
        ("ADMIN", "Platform Administrator"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255, help_text="Display name visible to matched users")
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255, blank=True, help_text="PBKDF2-hashed secure password")
    phone_number_encrypted = models.CharField(
        max_length=255, blank=True,
        help_text="AES-encrypted phone number — never displayed in plaintext to other users"
    )
    user_type = models.CharField(max_length=16, choices=USER_TYPE, default="CLIENT")
    preferred_language = models.CharField(
        max_length=32, default="English",
        help_text="Primary communication language (Hindi, English, Tamil, Japanese, etc.)"
    )
    is_anonymous_mode = models.BooleanField(
        default=True,
        help_text="When True, identity is hidden in Trauma Feed posts and Peer Connect"
    )
    bio = models.TextField(blank=True, help_text="Short personal introduction visible on profile")
    active_role = models.CharField(max_length=16, default="client")
    client_enrolled = models.BooleanField(default=True)
    listener_enrolled = models.BooleanField(default=False)
    pairing_code = models.CharField(max_length=64, blank=True)
    timezone = models.CharField(max_length=64, default="Asia/Kolkata")
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password: str):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        if not self.password_hash:
            return False
        return check_password(raw_password, self.password_hash)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.user_type})"


class UserContext(models.Model):
    """
    Private encrypted notes and reflections saved by the user in My Space.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name="private_context")
    content = models.TextField(blank=True, help_text="Private encrypted context")
    share_mode = models.CharField(max_length=32, default="private")
    reflections = models.TextField(blank=True, help_text="Personal journal reflections")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Context"
        verbose_name_plural = "User Contexts"

    def __str__(self):
        return f"Context for {self.user.full_name} ({self.share_mode})"

