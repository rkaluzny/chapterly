from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('register/', views.register, name='register'),
    path('import/', views.ImportView.as_view(), name='import-data'),
    
    # Topic URLs
    path('topics/', views.TopicListView.as_view(), name='topic-list'),
    path('topics/<int:pk>/', views.TopicDetailView.as_view(), name='topic-detail'),
    path('topics/create/', views.TopicCreateView.as_view(), name='topic-create'),
    path('topics/<int:pk>/update/', views.TopicUpdateView.as_view(), name='topic-update'),
    path('topics/<int:pk>/delete/', views.TopicDeleteView.as_view(), name='topic-delete'),
    path('topics/<int:pk>/share/', views.ShareTopicView.as_view(), name='share-topic'),
    path('topics/<int:pk>/export/', views.export_topic, name='export-topic'),

    # Deck URLs
    path('topics/<int:topic_pk>/decks/create/', views.DeckCreateView.as_view(), name='deck-create'),
    path('topics/<int:topic_pk>/decks/<int:pk>/', views.DeckDetailView.as_view(), name='deck-detail'),
    path('topics/<int:topic_pk>/decks/<int:pk>/update/', views.DeckUpdateView.as_view(), name='deck-update'),
    path('topics/<int:topic_pk>/decks/<int:pk>/delete/', views.DeckDeleteView.as_view(), name='deck-delete'),
    path('topics/<int:topic_pk>/decks/<int:pk>/share/', views.ShareDeckView.as_view(), name='share-deck'),
    path('topics/<int:topic_pk>/decks/<int:pk>/export/', views.export_deck, name='export-deck'),

    # Shared decks
    path('shared-with-me/', views.SharedWithMeListView.as_view(), name='shared-with-me'),
    path('shared-decks/<int:pk>/decline/', views.decline_shared_deck, name='decline-shared-deck'),
    path('shared-decks/<int:pk>/accept/', views.AcceptSharedDeckView.as_view(), name='accept-shared-deck'),

    # Shared topics
    path('shared-topics/', views.SharedTopicListView.as_view(), name='shared-topic-list'),
    path('shared-topics/<int:pk>/accept/', views.accept_shared_topic, name='accept-shared-topic'),
    path('shared-topics/<int:pk>/decline/', views.decline_shared_topic, name='decline-shared-topic'),

    # Card URLs
    path('topics/<int:topic_pk>/decks/<int:deck_pk>/cards/create/', views.CardCreateView.as_view(), name='card-create'),
    path('topics/<int:topic_pk>/decks/<int:deck_pk>/cards/<int:pk>/update/', views.CardUpdateView.as_view(), name='card-update'),
    path('topics/<int:topic_pk>/decks/<int:deck_pk>/cards/<int:pk>/delete/', views.CardDeleteView.as_view(), name='card-delete'),
    path('cards/<int:card_pk>/track/', views.track_learning_event, name='track-learning'),

    # Learn Mode URLs
    path('topics/<int:topic_pk>/decks/<int:deck_pk>/learn/', views.LearnView.as_view(), name='learn-cards'),
    path('topics/<int:topic_pk>/decks/<int:deck_pk>/learn/get-deck/', views.get_deck_for_learning, name='get-deck-for-learning'),
    path('topics/<int:topic_pk>/decks/<int:deck_pk>/learn/get-card/', views.get_card_for_learning, name='get-card'),
    path('topics/<int:topic_pk>/decks/<int:deck_pk>/learn/update-progress/<int:card_pk>/', views.update_card_progress, name='update-progress'),
]