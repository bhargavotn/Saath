from django.contrib import admin
from django.utils.html import format_html
from .models import CounselorProfile, CounselorReview


class CounselorReviewInline(admin.TabularInline):
    model = CounselorReview
    extra = 0
    readonly_fields = ("reviewer", "rating", "review_text", "session_date", "created_at")


@admin.register(CounselorProfile)
class CounselorProfileAdmin(admin.ModelAdmin):
    list_display = (
        "display_name", "languages_display", "specialties_display",
        "rate_per_minute", "star_rating", "availability_status",
        "is_verified", "total_sessions_completed"
    )
    list_filter = ("is_verified", "is_available_now", "years_of_experience")
    search_fields = ("display_name", "qualification", "personal_story")
    inlines = [CounselorReviewInline]

    def languages_display(self, obj):
        return ", ".join(obj.languages_spoken) if obj.languages_spoken else "—"
    languages_display.short_description = "Languages"

    def specialties_display(self, obj):
        if not obj.specialties:
            return "—"
        pills = "".join(
            f'<span style="background:#ddd6fe; color:#5b21b6; padding:2px 6px; border-radius:4px; '
            f'font-size:10px; font-weight:600; margin-right:3px;">{s}</span>'
            for s in obj.specialties[:3]
        )
        return format_html(pills)
    specialties_display.short_description = "Specialties"

    def star_rating(self, obj):
        stars = "⭐" * int(obj.average_rating)
        return format_html('<span>{} <b>({})</b></span>', stars, obj.average_rating)
    star_rating.short_description = "Rating"

    def availability_status(self, obj):
        if obj.is_available_now:
            return format_html(
                '<span style="color:#10b981; font-weight:bold;">🟢 Online Now</span>'
            )
        return format_html('<span style="color:#94a3b8;">⚫ Offline</span>')
    availability_status.short_description = "Status"


@admin.register(CounselorReview)
class CounselorReviewAdmin(admin.ModelAdmin):
    list_display = ("counselor", "reviewer", "rating", "session_date", "created_at")
    list_filter = ("rating",)
    search_fields = ("review_text",)

