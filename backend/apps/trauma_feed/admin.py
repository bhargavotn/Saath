from django.contrib import admin
from django.utils.html import format_html
from .models import TraumaStory, SupportReaction


@admin.register(TraumaStory)
class TraumaStoryAdmin(admin.ModelAdmin):
    list_display = ("anonymous_display", "category", "language", "support_reaction_count", "is_premium_content", "created_at")
    list_filter = ("category", "language", "is_anonymous", "is_premium_content")
    search_fields = ("content",)
    readonly_fields = ("support_reaction_count",)

    def anonymous_display(self, obj):
        if obj.is_anonymous:
            return format_html('<span style="color:#a78bfa;">🔒 {}</span>', obj.anonymous_alias or "Anonymous")
        return obj.author.full_name
    anonymous_display.short_description = "Author"


@admin.register(SupportReaction)
class SupportReactionAdmin(admin.ModelAdmin):
    list_display = ("story", "reactor", "reaction_type", "reacted_at")
    list_filter = ("reaction_type",)

