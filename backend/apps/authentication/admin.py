from django.contrib import admin
from django.utils.html import format_html
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "user_type_badge", "preferred_language", "is_anonymous_mode", "created_at")
    list_filter = ("user_type", "preferred_language", "is_anonymous_mode")
    search_fields = ("full_name", "email")

    def user_type_badge(self, obj):
        colors = {"CLIENT": "#3B82F6", "COUNSELOR": "#10B981", "ADMIN": "#8B5CF6"}
        bg = colors.get(obj.user_type, "#64748B")
        return format_html(
            '<span style="background:{}; color:#fff; padding:3px 10px; border-radius:12px; '
            'font-size:11px; font-weight:700;">{}</span>', bg, obj.user_type
        )
    user_type_badge.short_description = "Role"
