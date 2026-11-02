from django.contrib import admin
from django.utils.html import format_html
from .models import CounselingSession, SavedConnection


@admin.register(CounselingSession)
class CounselingSessionAdmin(admin.ModelAdmin):
    list_display = (
        "client", "counselor_display", "session_type", "status_badge",
        "language_used", "duration_minutes", "amount_charged", "is_encrypted"
    )
    list_filter = ("session_type", "status", "payment_status", "is_encrypted", "calming_music_played")
    search_fields = ("client__full_name",)

    def counselor_display(self, obj):
        return obj.counselor.display_name if obj.counselor else "AI Listener"
    counselor_display.short_description = "Counselor"

    def status_badge(self, obj):
        colors = {
            "REQUESTED": "#F59E0B",
            "ACTIVE": "#10B981",
            "COMPLETED": "#6B7280",
            "CANCELLED": "#EF4444",
        }
        bg = colors.get(obj.status, "#64748B")
        return format_html(
            '<span style="background:{}; color:#fff; padding:3px 10px; border-radius:12px; '
            'font-size:11px; font-weight:700;">{}</span>', bg, obj.status
        )
    status_badge.short_description = "Status"


@admin.register(SavedConnection)
class SavedConnectionAdmin(admin.ModelAdmin):
    list_display = ("user", "saved_counselor", "saved_peer", "nickname", "last_session_date")
    search_fields = ("user__full_name", "nickname")

