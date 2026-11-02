from django.contrib import admin
from django.utils.html import format_html
from .models import MoodCheckIn, WellnessAssignment


@admin.register(MoodCheckIn)
class MoodCheckInAdmin(admin.ModelAdmin):
    list_display = ("user", "mood_visual", "mood_level", "routed_to_human", "check_in_time")
    list_filter = ("mood_label", "routed_to_human")
    search_fields = ("user__full_name", "trigger_description")

    def mood_visual(self, obj):
        colors = {
            "DISTRESSED": "#DC2626", "ANXIOUS": "#EA580C", "SAD": "#6366F1",
            "NEUTRAL": "#64748B", "CALM": "#0EA5E9", "HOPEFUL": "#F59E0B", "HAPPY": "#10B981"
        }
        bg = colors.get(obj.mood_label, "#64748B")
        return format_html(
            '<span style="background:{}; color:#fff; padding:3px 10px; border-radius:12px; '
            'font-size:11px; font-weight:700;">{}</span>', bg, obj.get_mood_label_display()
        )
    mood_visual.short_description = "Mood"


@admin.register(WellnessAssignment)
class WellnessAssignmentAdmin(admin.ModelAdmin):
    list_display = ("user", "assignment_type", "completion_status", "assigned_date")
    list_filter = ("assignment_type", "is_completed")

    def completion_status(self, obj):
        if obj.is_completed:
            return format_html('<span style="color:#10b981; font-weight:bold;">✓ Completed</span>')
        return format_html('<span style="color:#f59e0b;">⏳ Pending</span>')
    completion_status.short_description = "Status"

