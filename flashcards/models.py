from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Topic(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="topics")
    shared_with = models.ManyToManyField(User, related_name='shared_topics', blank=True)

    def __str__(self):
        return self.name

class Deck(models.Model):
    name = models.CharField(max_length=100)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="decks")
    shared_with = models.ManyToManyField(User, related_name='shared_decks', blank=True)

    def __str__(self):
        return self.name

class Card(models.Model):
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name="cards")
    front = models.TextField()
    back = models.TextField()
    last_learned = models.DateTimeField(null=True, blank=True)
    learned_count = models.IntegerField(default=0)
    learning_level = models.IntegerField(default=0)
    next_review_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.front[:20]}..."