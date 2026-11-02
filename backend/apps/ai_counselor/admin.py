from django.contrib import admin
from .models import CounselorChatMessage


@admin.register(CounselorChatMessage)
class CounselorChatMessageAdmin(admin.ModelAdmin):
    list_display = ("sent_at", "role", "engine_routed", "short_body")
    list_filter = ("role", "engine_routed")
    search_fields = ("content",)
    readonly_fields = ("sent_at",)

    def short_body(self, obj):
        return obj.content[:75] + ("..." if len(obj.content) > 75 else "")
    short_body.short_description = "Message Snippet"
