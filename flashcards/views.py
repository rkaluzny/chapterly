from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy, reverse
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView, TemplateView
from django.views.generic.edit import FormView
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Q
from .forms import RegistrationForm, ShareDeckForm, AcceptDeckForm, ShareTopicForm
from .models import Topic, Deck, Card, User
from datetime import timedelta

# --- Main Views ---

def home(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'flashcards/home.html')

def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')
    else:
        form = RegistrationForm()
    return render(request, 'registration/register.html', {'form': form})

from django.db.models import Count, Q

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "flashcards/dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user

        # Basic counts
        user_topics = Topic.objects.filter(user=user)
        user_decks = Deck.objects.filter(topic__user=user)
        user_cards = Card.objects.filter(deck__topic__user=user)

        context['topic_count'] = user_topics.count()
        context['deck_count'] = user_decks.count()
        context['card_count'] = user_cards.count()

        # Decks to learn (practice suggestions)
        decks_to_learn = user_decks.annotate(
            card_count_in_deck=Count('cards')
        ).filter(card_count_in_deck__gt=0).order_by('-card_count_in_deck')[:5]
        
        for deck in decks_to_learn:
            deck.due_cards_count = deck.card_count_in_deck

        context['decks_to_learn'] = decks_to_learn

        # Recent topics
        context['recent_topics'] = user_topics.order_by('-id')[:5]
        
        # Weekly Progress
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        
        # Query for all cards learned by the user in the last 7 days
        all_learned_cards = Card.objects.filter(
            deck__topic__user=user, 
            last_learned__date__gte=week_start
        ).values('last_learned__date').annotate(count=Count('id'))
        
        learned_map = {item['last_learned__date']: item['count'] for item in all_learned_cards}
        
        learned_per_day = []
        for i in range(7):
            day = week_start + timedelta(days=i)
            count = learned_map.get(day, 0)
            learned_per_day.append(count)
            
        context['weekly_progress_labels'] = [(week_start + timedelta(days=i)).strftime("%a") for i in range(7)]
        context['weekly_progress_data'] = learned_per_day

        return context

# --- Topic CRUD ---

class TopicListView(LoginRequiredMixin, ListView):
    model = Topic
    context_object_name = 'topics'
    template_name = 'flashcards/topic_list.html'

    def get_queryset(self):
        return Topic.objects.filter(user=self.request.user).order_by('name')

class TopicDetailView(LoginRequiredMixin, DetailView):
    model = Topic
    template_name = 'flashcards/topic_detail.html'
    context_object_name = 'topic'

    def get_queryset(self):
        return Topic.objects.filter(user=self.request.user)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['decks'] = self.object.decks.all().order_by('name')
        return context

class TopicCreateView(LoginRequiredMixin, CreateView):
    model = Topic
    fields = ['name']
    template_name = 'flashcards/topic_form.html'
    success_url = reverse_lazy('topic-list')

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)

class TopicUpdateView(LoginRequiredMixin, UpdateView):
    model = Topic
    fields = ['name']
    template_name = 'flashcards/topic_form.html'
    success_url = reverse_lazy('topic-list')

    def get_queryset(self):
        return Topic.objects.filter(user=self.request.user)

class TopicDeleteView(LoginRequiredMixin, DeleteView):
    model = Topic
    template_name = 'flashcards/topic_confirm_delete.html'
    success_url = reverse_lazy('topic-list')

    def get_queryset(self):
        return Topic.objects.filter(user=self.request.user)

# --- Deck CRUD ---

class DeckDetailView(LoginRequiredMixin, DetailView):
    model = Deck
    template_name = 'flashcards/deck_detail.html'
    context_object_name = 'deck'

    def get_queryset(self):
        return Deck.objects.filter(Q(topic__user=self.request.user) | Q(pk__in=self.request.user.shared_decks.all()))
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['cards'] = self.object.cards.all().order_by('id')
        context['topic'] = self.object.topic
        return context

class DeckCreateView(LoginRequiredMixin, CreateView):
    model = Deck
    fields = ['name']
    template_name = 'flashcards/deck_form.html'

    def form_valid(self, form):
        topic = get_object_or_404(Topic, pk=self.kwargs['topic_pk'], user=self.request.user)
        form.instance.topic = topic
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('topic-detail', kwargs={'pk': self.kwargs['topic_pk']})
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['topic'] = get_object_or_404(Topic, pk=self.kwargs['topic_pk'], user=self.request.user)
        return context

class DeckUpdateView(LoginRequiredMixin, UpdateView):
    model = Deck
    fields = ['name']
    template_name = 'flashcards/deck_form.html'
    context_object_name = 'deck'

    def get_queryset(self):
        return Deck.objects.filter(topic__user=self.request.user, topic__pk=self.kwargs['topic_pk'])

    def get_success_url(self):
        return reverse('topic-detail', kwargs={'pk': self.kwargs['topic_pk']})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['topic'] = get_object_or_404(Topic, pk=self.kwargs['topic_pk'], user=self.request.user)
        return context

class DeckDeleteView(LoginRequiredMixin, DeleteView):
    model = Deck
    template_name = 'flashcards/deck_confirm_delete.html'
    context_object_name = 'deck'

    def get_queryset(self):
        return Deck.objects.filter(topic__user=self.request.user, topic__pk=self.kwargs['topic_pk'])

    def get_success_url(self):
        return reverse('topic-detail', kwargs={'pk': self.kwargs['topic_pk']})

# --- Card CRUD ---

class CardCreateView(LoginRequiredMixin, CreateView):
    model = Card
    fields = ['front', 'back']
    template_name = 'flashcards/card_form.html'

    def form_valid(self, form):
        deck = get_object_or_404(Deck, pk=self.kwargs['deck_pk'])
        if deck.topic.user != self.request.user:
            return redirect('home')
        form.instance.deck = deck
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('deck-detail', kwargs={'topic_pk': self.kwargs['topic_pk'], 'pk': self.kwargs['deck_pk']})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        deck = get_object_or_404(Deck, pk=self.kwargs['deck_pk'])
        context['deck'] = deck
        context['topic'] = deck.topic
        return context

class CardUpdateView(LoginRequiredMixin, UpdateView):
    model = Card
    fields = ['front', 'back']
    template_name = 'flashcards/card_form.html'
    context_object_name = 'card'

    def get_queryset(self):
        return Card.objects.filter(deck__topic__user=self.request.user)

    def get_success_url(self):
        return reverse('deck-detail', kwargs={'topic_pk': self.kwargs['topic_pk'], 'pk': self.kwargs['deck_pk']})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        card = self.get_object()
        context['deck'] = card.deck
        context['topic'] = card.deck.topic
        return context

class CardDeleteView(LoginRequiredMixin, DeleteView):
    model = Card
    template_name = 'flashcards/card_confirm_delete.html'
    context_object_name = 'card'

    def get_queryset(self):
        return Card.objects.filter(deck__topic__user=self.request.user)

    def get_success_url(self):
        return reverse('deck-detail', kwargs={'topic_pk': self.kwargs['topic_pk'], 'pk': self.kwargs['deck_pk']})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        card = self.get_object()
        context['deck'] = card.deck
        context['topic'] = card.deck.topic
        return context

import json

# --- Export Views ---
@login_required
def export_topic(request, pk):
    topic = get_object_or_404(Topic, pk=pk, user=request.user)
    
    decks_data = []
    for deck in topic.decks.all():
        cards_data = [{'front': card.front, 'back': card.back} for card in deck.cards.all()]
        decks_data.append({'name': deck.name, 'cards': cards_data})
        
    data = {
        'type': 'topic',
        'name': topic.name,
        'decks': decks_data,
    }
    
    response = JsonResponse(data)
    response['Content-Disposition'] = f'attachment; filename="topic_{topic.id}_{topic.name}.json"'
    return response

@login_required
def export_deck(request, topic_pk, pk):
    deck = get_object_or_404(Deck, pk=pk, topic__user=request.user)
    
    cards_data = [{'front': card.front, 'back': card.back} for card in deck.cards.all()]
    
    data = {
        'type': 'deck',
        'name': deck.name,
        'cards': cards_data,
    }
    
    response = JsonResponse(data)
    response['Content-Disposition'] = f'attachment; filename="deck_{deck.id}_{deck.name}.json"'
    return response

from .forms import RegistrationForm, ShareDeckForm, AcceptDeckForm, ShareTopicForm, ImportForm
import json

class ImportView(LoginRequiredMixin, FormView):
    form_class = ImportForm
    template_name = 'flashcards/import_form.html'
    success_url = reverse_lazy('topic-list')

    def form_valid(self, form):
        json_file = form.cleaned_data['file']
        try:
            data = json.load(json_file)
        except json.JSONDecodeError:
            form.add_error('file', 'Invalid JSON file.')
            return self.form_invalid(form)

        if data.get('type') == 'topic':
            self._import_topic(data)
        elif data.get('type') == 'deck':
            self._import_deck(data)
        else:
            form.add_error('file', 'Invalid file format: missing "type" key.')
            return self.form_invalid(form)

        return super().form_valid(form)

    def _import_topic(self, data):
        # Create a new topic, adding a suffix to avoid name conflicts
        new_topic = Topic.objects.create(
            name=f"{data.get('name', 'Imported Topic')} (imported)",
            user=self.request.user
        )
        for deck_data in data.get('decks', []):
            new_deck = Deck.objects.create(
                name=deck_data.get('name', 'Imported Deck'),
                topic=new_topic
            )
            cards_to_create = [
                Card(deck=new_deck, front=card.get('front'), back=card.get('back'))
                for card in deck_data.get('cards', [])
            ]
            Card.objects.bulk_create(cards_to_create)

    def _import_deck(self, data):
        # Get or create a default topic for imported decks
        import_topic, _ = Topic.objects.get_or_create(
            name="[Imported Decks]",
            user=self.request.user
        )
        new_deck = Deck.objects.create(
            name=f"{data.get('name', 'Imported Deck')} (imported)",
            topic=import_topic
        )
        cards_to_create = [
            Card(deck=new_deck, front=card.get('front'), back=card.get('back'))
            for card in data.get('cards', [])
        ]
        Card.objects.bulk_create(cards_to_create)

# --- Learning Mode Views ---

class SharedWithMeListView(LoginRequiredMixin, ListView):
    model = Deck
    context_object_name = 'shared_decks'
    template_name = 'flashcards/shared_with_me.html'

    def get_queryset(self):
        return self.request.user.shared_decks.all().order_by('name')

class SharedTopicListView(LoginRequiredMixin, ListView):
    model = Topic
    context_object_name = 'shared_topics'
    template_name = 'flashcards/shared_topics.html'

    def get_queryset(self):
        return self.request.user.shared_topics.all().order_by('name')

class ShareDeckView(LoginRequiredMixin, FormView):
    form_class = ShareDeckForm
    template_name = 'flashcards/share_deck_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['deck'] = get_object_or_404(Deck, pk=self.kwargs['pk'], topic__user=self.request.user)
        return context

    def form_valid(self, form):
        deck = get_object_or_404(Deck, pk=self.kwargs['pk'], topic__user=self.request.user)
        email = form.cleaned_data['email']
        try:
            user_to_share_with = User.objects.get(email=email)
            if user_to_share_with != self.request.user:
                deck.shared_with.add(user_to_share_with)
        except User.DoesNotExist:
            form.add_error('email', 'User with this email address not found.')
            return self.form_invalid(form)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('deck-detail', kwargs={'topic_pk': self.kwargs['topic_pk'], 'pk': self.kwargs['pk']})

class AcceptSharedDeckView(LoginRequiredMixin, FormView):
    form_class = AcceptDeckForm
    template_name = 'flashcards/accept_deck_form.html'

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['shared_deck'] = get_object_or_404(Deck, pk=self.kwargs['pk'])
        return context

    def form_valid(self, form):
        original_deck = get_object_or_404(Deck, pk=self.kwargs['pk'])
        target_topic = form.cleaned_data['topic']
        new_deck = Deck.objects.create(name=original_deck.name, topic=target_topic)
        cards_to_create = [Card(deck=new_deck, front=card.front, back=card.back) for card in original_deck.cards.all()]
        Card.objects.bulk_create(cards_to_create)
        original_deck.shared_with.remove(self.request.user)
        self.success_url = reverse('deck-detail', kwargs={'topic_pk': new_deck.topic.pk, 'pk': new_deck.pk})
        return super().form_valid(form)

@login_required
@require_POST
def decline_shared_deck(request, pk):
    deck = get_object_or_404(Deck, pk=pk)
    deck.shared_with.remove(request.user)
    return redirect('shared-with-me')

class ShareTopicView(LoginRequiredMixin, FormView):
    form_class = ShareTopicForm
    template_name = 'flashcards/share_topic_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['topic'] = get_object_or_404(Topic, pk=self.kwargs['pk'], user=self.request.user)
        return context

    def form_valid(self, form):
        topic = get_object_or_404(Topic, pk=self.kwargs['pk'], user=self.request.user)
        email = form.cleaned_data['email']
        try:
            user_to_share_with = User.objects.get(email=email)
            if user_to_share_with != self.request.user:
                topic.shared_with.add(user_to_share_with)
        except User.DoesNotExist:
            form.add_error('email', 'User with this email address not found.')
            return self.form_invalid(form)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('topic-detail', kwargs={'pk': self.kwargs['pk']})

@login_required
@require_POST
def accept_shared_topic(request, pk):
    original_topic = get_object_or_404(Topic, pk=pk)
    new_topic = Topic.objects.create(name=original_topic.name, user=request.user)
    for original_deck in original_topic.decks.all():
        new_deck = Deck.objects.create(name=original_deck.name, topic=new_topic)
        cards_to_create = [Card(deck=new_deck, front=card.front, back=card.back) for card in original_deck.cards.all()]
        Card.objects.bulk_create(cards_to_create)
    original_topic.shared_with.remove(request.user)
    return redirect('topic-detail', pk=new_topic.pk)

@login_required
@require_POST
def decline_shared_topic(request, pk):
    topic = get_object_or_404(Topic, pk=pk)
    topic.shared_with.remove(request.user)
    return redirect('shared-topic-list')

# --- Learning Mode Views ---

class LearnView(LoginRequiredMixin, TemplateView):
    template_name = 'flashcards/learn_cards.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        deck = get_object_or_404(Deck, pk=self.kwargs['deck_pk'])
        if deck.topic.user != self.request.user and self.request.user not in deck.shared_with.all():
            return redirect('home')
        context['deck'] = deck
        context['topic'] = deck.topic
        return context

@login_required
def get_deck_for_learning(request, topic_pk, deck_pk):
    deck = get_object_or_404(Deck, pk=deck_pk)
    if deck.topic.user != request.user and request.user not in deck.shared_with.all():
        return JsonResponse({'status': 'error', 'message': 'Permission denied'}, status=403)
    cards = list(deck.cards.values('id', 'front', 'back'))
    return JsonResponse({'cards': cards})

# DEPRECATED - The following views are no longer used by the new learning mode
@login_required
def get_card_for_learning(request, topic_pk, deck_pk):
    return JsonResponse({'status': 'error', 'message': 'This view is deprecated.'}, status=410)

@login_required
def update_card_progress(request, topic_pk, deck_pk, card_pk):
    return JsonResponse({'status': 'error', 'message': 'This view is deprecated.'}, status=410)

@login_required
@require_POST
def track_learning_event(request, card_pk):
    card = get_object_or_404(Card, pk=card_pk)
    # Basic permission check
    if card.deck.topic.user != request.user and request.user not in card.deck.shared_with.all():
        return JsonResponse({'status': 'error', 'message': 'Permission denied'}, status=403)
    
    card.last_learned = timezone.now()
    card.learned_count += 1
    card.save(update_fields=['last_learned', 'learned_count'])
    
    return JsonResponse({'status': 'success'})
