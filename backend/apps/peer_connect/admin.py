from django.contrib import admin
from django.utils.html import format_html
from .models import CompatibilityAssessment, PeerMatch, CommunityRoom


@admin.register(CompatibilityAssessment)
class CompatibilityAssessmentAdmin(admin.ModelAdmin):
    list_display = ("user", "verification_badge", "mood_snapshot", "assessment_date")
    list_filter = ("is_human_verified",)
    search_fields = ("user__full_name",)

    def verification_badge(self, obj):
        if obj.is_human_verified:
            return format_html('<span style="color:#10b981; font-weight:bold;">✓ Human Verified</span>')
        return format_html('<span style="color:#ef4444; font-weight:bold;">⚠ Unverified</span>')
    verification_badge.short_description = "Anti-AI Check"


@admin.register(PeerMatch)
class PeerMatchAdmin(admin.ModelAdmin):
    list_display = ("user_one", "user_two", "compatibility_score", "match_language", "status", "matched_at")
    list_filter = ("status", "match_language")


@admin.register(CommunityRoom)
class CommunityRoomAdmin(admin.ModelAdmin):
    list_display = ("room_name", "room_type", "language", "max_participants", "is_active")
    list_filter = ("room_type", "language", "is_active")

