from django.contrib import admin
from .models import Topic, Deck, Card

class CardInline(admin.TabularInline):
    model = Card
    extra = 1 # How many extra forms to show

class DeckInline(admin.TabularInline):
    model = Deck
    extra = 1
    show_change_link = True

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'user')
    search_fields = ('name', 'user__username')
    list_filter = ('user',)
    inlines = [DeckInline]

@admin.register(Deck)
class DeckAdmin(admin.ModelAdmin):
    list_display = ('name', 'topic', 'get_topic_user')
    search_fields = ('name', 'topic__name')
    list_filter = ('topic__user', 'topic')
    inlines = [CardInline]

    @admin.display(description='Topic Owner')
    def get_topic_user(self, obj):
        return obj.topic.user

@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('front', 'deck', 'last_learned', 'learning_level')
    search_fields = ('front', 'back', 'deck__name')
    list_filter = ('deck__topic', 'deck', 'learning_level')
    ordering = ('-last_learned',)
