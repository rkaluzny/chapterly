from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Topic

class RegistrationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields + ('email',)

class ShareDeckForm(forms.Form):
    email = forms.EmailField(label="Email to share with")

class AcceptDeckForm(forms.Form):
    topic = forms.ModelChoiceField(queryset=Topic.objects.none(), label="Choose a topic to add the deck to")

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields['topic'].queryset = Topic.objects.filter(user=user)

class ShareTopicForm(forms.Form):
    email = forms.EmailField(label="Email to share with")

class ImportForm(forms.Form):
    file = forms.FileField(label="Select JSON File")

