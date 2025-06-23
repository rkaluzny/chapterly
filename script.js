// Book Reading App - Main Script

// Sound Effects
const ACHIEVEMENT_SOUND = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYZxhxzGAAAAAAAAAAAAAAAAAAAA//tQxAAACVQBIlQAAAgAAA0gAAABJBEEQBBBCQRBEEAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ//tQxBYAC0QBIdAAABAAAA0gAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB//tQxDYAF5gBH9AAABBYAGMaAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');

// DOM Elements
const addBookBtn = document.getElementById('add-book-btn');
const addBookForm = document.getElementById('add-book-form');
const saveBookBtn = document.getElementById('save-book-btn');
const cancelBtn = document.getElementById('cancel-btn');
const bookTitle = document.getElementById('book-title');
const bookAuthor = document.getElementById('book-author');
const bookChapters = document.getElementById('book-chapters');
const bookGenre = document.getElementById('book-genre');
const bookCoverInput = document.getElementById('book-cover-input');
const bookCoverBtn = document.getElementById('book-cover-btn');
const coverPreview = document.getElementById('cover-preview');
const coverPreviewImage = document.getElementById('cover-preview-image');
const removeCoverBtn = document.getElementById('remove-cover-btn');
const booksContainer = document.getElementById('books-container');
const noBookMessage = document.getElementById('no-books-message');
const darkmodeToggle = document.getElementById('darkmode-toggle');
const totalChaptersReadElement = document.getElementById('total-chapters-read');
const booksInProgressElement = document.getElementById('books-in-progress');
const booksCompletedElement = document.getElementById('books-completed');
const todayChaptersReadElement = document.getElementById('today-chapters-read');
const dailyGoalStatus = document.querySelector('.daily-goal-status');
const dailyGoalInput = document.getElementById('daily-goal-input');
const saveGoalBtn = document.getElementById('save-goal-btn');
const currentGoalDisplay = document.getElementById('current-goal-display');
const statusFilter = document.getElementById('status-filter');
const genreFilter = document.getElementById('genre-filter');
const showReadingStatsBtn = document.getElementById('show-reading-stats-btn');
const readingProgressContainer = document.getElementById('reading-progress-container');
const closeChartBtn = document.getElementById('close-chart-btn');
const resetAppBtn = document.getElementById('reset-app-btn');
const confirmationDialog = document.getElementById('confirmation-dialog');
const dialogTitle = document.getElementById('dialog-title');
const dialogMessage = document.getElementById('dialog-message');
const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
const dialogConfirmBtn = document.getElementById('dialog-confirm-btn');
const previouslyReadCheckbox = document.getElementById('previously-read');

// Book template
const bookTemplate = document.getElementById('book-template');

// App State
let books = [];
let editingBookId = null;
let selectedCoverImage = null;
let sortable = null;
let readingChart = null;
let currentFilters = {
    status: 'all',
    genre: 'all'
};

// Constants for progress tracking
const DAILY_PROGRESS_KEY = 'daily_reading_progress';
const DAILY_GOAL_KEY = 'daily_reading_goal';
const SOUND_ENABLED_KEY = 'sound_enabled';
const MAX_DAYS_HISTORY = 7;

// Initialize the app
function initApp() {
    console.log('App initialization started...');
    
    // Log all DOM elements to check if they're found
    console.log('DOM Elements check:', {
        addBookBtn: !!addBookBtn,
        addBookForm: !!addBookForm,
        saveBookBtn: !!saveBookBtn,
        cancelBtn: !!cancelBtn,
        bookTitle: !!bookTitle,
        booksContainer: !!booksContainer,
        noBookMessage: !!noBookMessage
    });

    try {
        loadBooks();
        renderBooks();
        updateStats();
        initDarkMode();
        initSortable();
        initFilters();
        initDailyGoal();
        initSoundSettings();
        updateDailyProgress();
        addEventListeners();
        
        console.log('App initialization completed');
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
}

// Initialize sound settings
function initSoundSettings() {
    const soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
    const soundToggle = document.getElementById('enable-sounds');
    soundToggle.checked = soundEnabled;
    
    soundToggle.addEventListener('change', (e) => {
        localStorage.setItem(SOUND_ENABLED_KEY, e.target.checked);
    });
}

// Play achievement sound
function playAchievementSound() {
    const soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
    if (soundEnabled) {
        ACHIEVEMENT_SOUND.play().catch(err => console.log('Sound playback failed:', err));
    }
}

// Toggle favorite status
function toggleFavorite(bookId) {
    const bookIndex = books.findIndex(b => b.id === bookId);
    if (bookIndex !== -1) {
        books[bookIndex].favorite = !books[bookIndex].favorite;
        saveBooks();
        renderBooks();
    }
}

// Initialize daily goal
function initDailyGoal() {
    // Load daily goal from localStorage
    const dailyGoal = localStorage.getItem(DAILY_GOAL_KEY);
    
    if (dailyGoal) {
        dailyGoalInput.value = dailyGoal;
        currentGoalDisplay.textContent = `${dailyGoal} chapters per day`;
        checkDailyGoalAchievement();
    }
    
    // Add event listener for saving goal
    saveGoalBtn.addEventListener('click', saveDailyGoal);
}

// Save daily goal
function saveDailyGoal() {
    const goal = parseInt(dailyGoalInput.value);
    
    if (isNaN(goal) || goal < 1) {
        alert('Please enter a valid daily goal (minimum 1 chapter).');
        return;
    }
    
    localStorage.setItem(DAILY_GOAL_KEY, goal);
    currentGoalDisplay.textContent = `${goal} chapters per day`;
    checkDailyGoalAchievement();
}

// Check if daily goal is achieved
function checkDailyGoalAchievement() {
    const dailyGoal = parseInt(localStorage.getItem(DAILY_GOAL_KEY));
    
    if (!dailyGoal) return;
    
    const today = new Date().toISOString().split('T')[0];
    const dailyProgress = JSON.parse(localStorage.getItem(DAILY_PROGRESS_KEY) || '{}');
    const todayChapters = dailyProgress[today] ? dailyProgress[today].count : 0;
    
    if (todayChapters >= dailyGoal) {
        dailyGoalStatus.classList.remove('hidden');
    } else {
        dailyGoalStatus.classList.add('hidden');
    }
}

// Load books from localStorage
function loadBooks() {
    const savedBooks = localStorage.getItem('books');
    if (savedBooks) {
        books = JSON.parse(savedBooks);
        // Migrate old book format if necessary
        books = books.map(book => ({
            ...book,
            favorite: book.favorite || false,
            chapters: book.chapters || Array(book.totalChapters).fill().map(() => ({ completed: false }))
        }));
    }
}

// Save books to localStorage
function saveBooks() {
    localStorage.setItem('books', JSON.stringify(books));
}

// Initialize Dark Mode
function initDarkMode() {
    // Check if dark mode is saved in localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
        darkmodeToggle.checked = true;
    }

    // Add event listener for dark mode toggle
    darkmodeToggle.addEventListener('change', () => {
        if (darkmodeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
        
        // If chart is visible, update it for the new theme
        if (!readingProgressContainer.classList.contains('hidden') && readingChart) {
            updateReadingChart();
        }
    });
}

// Initialize Sortable for drag and drop
function initSortable() {
    sortable = new Sortable(booksContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        filter: '#no-books-message', // Prevent dragging the "no books" message
        delay: 300, // Add delay for touch devices to distinguish between scroll and drag
        delayOnTouchOnly: true, // Only apply delay for touch devices
        touchStartThreshold: 10, // Increase touch threshold to make dragging less sensitive
        scrollSensitivity: 30, // Improve scroll sensitivity
        scrollSpeed: 10, // Adjust scroll speed
        onEnd: function(evt) {
            // Update the order of books
            if (evt.oldIndex !== evt.newIndex) {
                updateBooksOrder(evt.oldIndex, evt.newIndex);
            }
        }
    });
}

// Initialize filters
function initFilters() {
    try {
        // Set initial filter values
        currentFilters = {
            status: 'all',
            genre: 'all'
        };
        
        // Status filter
        if (statusFilter) {
            statusFilter.value = currentFilters.status;
            statusFilter.addEventListener('change', applyFilters);
        }
        
        // Genre filter
        if (genreFilter) {
            genreFilter.value = currentFilters.genre;
            genreFilter.addEventListener('change', applyFilters);
        }
        
        // Populate genre filter with unique genres from books
        updateGenreFilter();
    } catch (error) {
        console.error('Error initializing filters:', error);
    }
}

// Update genre filter options based on available books
function updateGenreFilter() {
    // Save current selection
    const currentGenre = genreFilter.value;
    
    // Clear all options except the "All genres" option
    while (genreFilter.options.length > 1) {
        genreFilter.options.remove(1);
    }
    
    // Get unique genres from books
    const genres = [...new Set(books.filter(book => book.genre).map(book => book.genre))];
    
    // Add genre options
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = getGenreName(genre);
        genreFilter.appendChild(option);
    });
    
    // Restore previous selection if it exists
    if (genres.includes(currentGenre)) {
        genreFilter.value = currentGenre;
    }
}

// Get display name for genre
function getGenreName(genre) {
    const genreMap = {
        'fantasy': 'Fantasy',
        'sci-fi': 'Science Fiction',
        'mystery': 'Mystery/Thriller',
        'romance': 'Romance',
        'biography': 'Biography',
        'non-fiction': 'Non-Fiction',
        'other': 'Other'
    };
    
    return genreMap[genre] || genre;
}

// Apply filters to books
function applyFilters() {
    // Get filter values
    currentFilters.status = statusFilter.value;
    currentFilters.genre = genreFilter.value;
    
    // Apply filters to books
    const bookCards = booksContainer.querySelectorAll('.book-card');
    
    bookCards.forEach(bookCard => {
        const bookId = bookCard.dataset.id;
        const book = books.find(b => b.id === bookId);
        
        if (!book) return;
        
        let showBook = shouldShowBook(book);
        
        bookCard.style.display = showBook ? '' : 'none';
    });
    
    // Show/hide no books message
    const visibleBooks = booksContainer.querySelectorAll('.book-card[style=""]').length;
    noBookMessage.style.display = visibleBooks === 0 ? '' : 'none';
    if (visibleBooks === 0) {
        noBookMessage.textContent = 'No books found with the selected filters.';
    }
}

// Check if book should be shown based on current filters
function shouldShowBook(book) {
    if (!book) return false;
    
    let showBook = true;
    
    // Status filter
    if (currentFilters.status !== 'all') {
        const readChaptersCount = book.readChapters.length;
        const totalChapters = book.totalChapters;
        
        switch (currentFilters.status) {
            case 'in-progress':
                showBook = readChaptersCount > 0 && readChaptersCount < totalChapters;
                break;
            case 'completed':
                showBook = readChaptersCount === totalChapters;
                break;
            case 'not-started':
                showBook = readChaptersCount === 0;
                break;
        }
    }
    
    // Genre filter
    if (showBook && currentFilters.genre !== 'all') {
        showBook = book.genre === currentFilters.genre;
    }
    
    return showBook;
}

// Update books order after drag and drop
function updateBooksOrder(oldIndex, newIndex) {
    const bookElements = Array.from(booksContainer.querySelectorAll('.book-card'));
    const newBooks = [];
    
    bookElements.forEach(bookElement => {
        const bookId = bookElement.dataset.id;
        const book = books.find(b => b.id === bookId);
        if (book) {
            newBooks.push(book);
        }
    });
    
    books = newBooks;
    saveBooks();
}

// Add event listeners
function addEventListeners() {
    console.log('Adding event listeners...');

    // Add book button
    if (addBookBtn) {
        addBookBtn.addEventListener('click', () => {
            console.log('Add book button clicked');
            showAddBookForm();
        });
    } else {
        console.error('Add book button not found');
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            hideAddBookForm();
        });
    } else {
        console.error('Cancel button not found');
    }
    
    // Save book button
    if (saveBookBtn) {
        saveBookBtn.addEventListener('click', () => {
            console.log('Save book button clicked');
            saveBook();
        });
    } else {
        console.error('Save book button not found');
    }
    
    // Book cover upload
    if (bookCoverBtn && bookCoverInput && removeCoverBtn) {
        bookCoverBtn.addEventListener('click', () => {
            console.log('Cover button clicked');
            bookCoverInput.click();
        });
        bookCoverInput.addEventListener('change', handleCoverUpload);
        removeCoverBtn.addEventListener('click', removeCoverImage);
    } else {
        console.error('One or more cover-related elements not found');
    }
    
    // Show reading stats button
    if (showReadingStatsBtn) {
        showReadingStatsBtn.addEventListener('click', () => {
            console.log('Show reading stats button clicked');
            toggleReadingProgressChart();
        });
    } else {
        console.error('Show reading stats button not found');
    }
    
    // Close chart button
    if (closeChartBtn) {
        closeChartBtn.addEventListener('click', () => {
            console.log('Close chart button clicked');
            readingProgressContainer.classList.add('hidden');
        });
    } else {
        console.error('Close chart button not found');
    }
    
    // Reset app button
    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', () => {
            console.log('Reset app button clicked');
            showResetConfirmation();
        });
    } else {
        console.error('Reset app button not found');
    }
    
    // Confirmation dialog buttons
    if (dialogCancelBtn) {
        dialogCancelBtn.addEventListener('click', () => {
            console.log('Dialog cancel button clicked');
            hideConfirmationDialog();
        });
    } else {
        console.error('Dialog cancel button not found');
    }

    console.log('Event listeners added successfully');
}

// Show add book form
function showAddBookForm() {
    addBookForm.classList.remove('hidden');
    bookTitle.focus();
    
    // Reset form
    bookTitle.value = '';
    bookAuthor.value = '';
    bookChapters.value = '';
    bookGenre.value = '';
    previouslyReadCheckbox.checked = false;
    removeCoverImage();
    editingBookId = null;
}

// Hide add book form
function hideAddBookForm() {
    addBookForm.classList.add('hidden');
    editingBookId = null;
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Handle cover image upload
function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size is too large. Please choose an image under 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            // Create an image element to check dimensions
            const img = new Image();
            img.onload = function() {
                // Resize image if it's too large
                const maxWidth = 800;
                const maxHeight = 800;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;

                    // Create canvas to resize image
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Get resized image as data URL
                    selectedCoverImage = canvas.toDataURL(file.type);
                } else {
                    selectedCoverImage = e.target.result;
                }

                // Update preview
                coverPreviewImage.src = selectedCoverImage;
                coverPreview.classList.remove('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Remove cover image
function removeCoverImage() {
    selectedCoverImage = null;
    coverPreviewImage.src = '';
    coverPreview.classList.add('hidden');
    bookCoverInput.value = '';
}

// Save book
function saveBook() {
    if (!bookTitle.value || !bookAuthor.value || !bookChapters.value || !bookGenre.value) {
        alert('Please fill in all required fields');
        return;
    }

    const totalChapters = parseInt(bookChapters.value);
    const isPreviouslyRead = previouslyReadCheckbox.checked;
    
    const bookData = {
        id: editingBookId || generateId(),
        title: bookTitle.value.trim(),
        author: bookAuthor.value.trim(),
        totalChapters: totalChapters,
        genre: bookGenre.value,
        coverImage: selectedCoverImage,
        chapters: Array(totalChapters).fill().map(() => ({ completed: isPreviouslyRead })),
        favorite: false,
        readChapters: isPreviouslyRead ? Array.from({length: totalChapters}, (_, i) => i + 1) : []
    };

    if (editingBookId) {
        // Update existing book
        const index = books.findIndex(b => b.id === editingBookId);
        if (index !== -1) {
            // Preserve existing chapters and favorite status
            bookData.chapters = books[index].chapters;
            bookData.favorite = books[index].favorite;
            bookData.readChapters = books[index].readChapters;
            books[index] = bookData;
        }
    } else {
        // Add new book
        books.push(bookData);
    }

    saveBooks();
    renderBooks();
    updateStats();
    updateGenreFilter();
    hideAddBookForm();
    resetForm();
}

// Render all books
function renderBooks() {
    try {
        booksContainer.innerHTML = '';
        
        if (books.length === 0) {
            noBookMessage.classList.remove('hidden');
            return;
        }
        
        noBookMessage.classList.add('hidden');
        
        // Sort books: favorites first, then by title
        const sortedBooks = [...books].sort((a, b) => {
            if (a.favorite !== b.favorite) {
                return b.favorite ? 1 : -1;
            }
            return a.title.localeCompare(b.title);
        });
        
        let visibleBooks = 0;
        
        sortedBooks.forEach(book => {
            if (shouldShowBook(book)) {
                const bookElement = renderBook(book);
                booksContainer.appendChild(bookElement);
                visibleBooks++;
            }
        });
        
        // Show message if no books match the filters
        if (visibleBooks === 0 && books.length > 0) {
            noBookMessage.classList.remove('hidden');
            noBookMessage.textContent = 'No books match the selected filters.';
        }
    } catch (error) {
        console.error('Error rendering books:', error);
    }
}

// Render single book
function renderBook(book) {
    try {
        const template = document.getElementById('book-template');
        const bookElement = template.content.cloneNode(true);
        const bookCard = bookElement.querySelector('.book-card');
        
        bookCard.dataset.id = book.id;
        
        // Set book details
        bookCard.querySelector('.book-title').textContent = book.title;
        bookCard.querySelector('.book-author').textContent = `by ${book.author}`;
        bookCard.querySelector('.book-genre').textContent = getGenreName(book.genre);
        bookCard.querySelector('.total-chapters').textContent = book.totalChapters;
        
        // Set up favorite button and status
        const favoriteBtn = bookCard.querySelector('.favorite-btn');
        if (favoriteBtn) {
            if (book.favorite) {
                bookCard.classList.add('favorite');
                const starIcon = favoriteBtn.querySelector('i');
                if (starIcon) {
                    starIcon.classList.remove('far');
                    starIcon.classList.add('fas');
                }
            }
            
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(book.id);
            });
        }
        
        // Set cover image if available
        const coverElement = bookCard.querySelector('.book-cover');
        if (coverElement) {
            // Clear any existing content
            coverElement.innerHTML = '';
            
            if (book.coverImage) {
                const img = document.createElement('img');
                img.src = book.coverImage;
                img.alt = `${book.title} cover`;
                coverElement.appendChild(img);
            } else {
                const icon = document.createElement('i');
                icon.className = 'fas fa-book';
                coverElement.appendChild(icon);
            }
        }
        
        // Calculate read chapters
        const readChapters = book.readChapters.length;
        const readChaptersElement = bookCard.querySelector('.read-chapters');
        if (readChaptersElement) {
            readChaptersElement.textContent = readChapters;
        }
        
        // Update progress bar
        const progress = (readChapters / book.totalChapters) * 100;
        const progressBar = bookCard.querySelector('.progress');
        const progressText = bookCard.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
        
        // Set up chapters container
        const chaptersContainer = bookCard.querySelector('.chapters-container');
        if (chaptersContainer) {
            for (let i = 0; i < book.totalChapters; i++) {
                const chapterItem = document.createElement('div');
                chapterItem.className = 'chapter-item';
                
                // Check if chapter is completed
                const isCompleted = book.chapters && book.chapters[i] && book.chapters[i].completed;
                // For backward compatibility
                const isInReadChapters = book.readChapters.includes(i + 1);
                
                if (isCompleted || isInReadChapters) {
                    chapterItem.classList.add('completed');
                }
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'chapter-checkbox';
                checkbox.id = `chapter-${book.id}-${i}`;
                checkbox.checked = isCompleted || isInReadChapters;
                
                const label = document.createElement('label');
                label.htmlFor = `chapter-${book.id}-${i}`;
                label.textContent = `Chapter ${i + 1}`;
                
                chapterItem.appendChild(checkbox);
                chapterItem.appendChild(label);
                chaptersContainer.appendChild(chapterItem);
                
                checkbox.addEventListener('change', (e) => toggleChapterRead(e, book.id));
            }
        }
        
        // Set up event listeners
        const editChaptersBtn = bookCard.querySelector('.edit-chapters-btn');
        if (editChaptersBtn) {
            editChaptersBtn.addEventListener('click', () => toggleChapters(book.id));
        }
        
        const markReadBtn = bookCard.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => markReadToday(book.id));
        }
        
        const deleteBookBtn = bookCard.querySelector('.delete-book-btn');
        if (deleteBookBtn) {
            deleteBookBtn.addEventListener('click', () => deleteBook(book.id));
        }
        
        return bookCard;
    } catch (error) {
        console.error('Error rendering book:', error);
        return document.createElement('div');
    }
}

// Toggle chapters list
function toggleChapters(bookId) {
    const bookCard = booksContainer.querySelector(`.book-card[data-id="${bookId}"]`);
    const chaptersContainer = bookCard.querySelector('.chapters-container');
    chaptersContainer.classList.toggle('hidden');
}

// Toggle chapter read status
function toggleChapterRead(event, bookId) {
    const checkbox = event.target;
    const chapterIndex = parseInt(checkbox.id.split('-')[2]);
    const book = books.find(b => b.id === bookId);
    
    if (!book) return;
    
    // Update chapter completion status
    if (!book.chapters[chapterIndex]) {
        book.chapters[chapterIndex] = { completed: false };
    }
    book.chapters[chapterIndex].completed = checkbox.checked;
    
    // Update readChapters array for backward compatibility
    const chapterNumber = chapterIndex + 1;
    if (checkbox.checked) {
        if (!book.readChapters.includes(chapterNumber)) {
            book.readChapters.push(chapterNumber);
            book.readChapters.sort((a, b) => a - b);
            recordChapterRead(bookId, chapterNumber);
        }
    } else {
        const index = book.readChapters.indexOf(chapterNumber);
        if (index !== -1) {
            book.readChapters.splice(index, 1);
        }
    }
    
    // Add animation class
    const chapterItem = checkbox.closest('.chapter-item');
    if (checkbox.checked) {
        chapterItem.classList.add('completed');
    } else {
        chapterItem.classList.remove('completed');
    }
    
    // Save changes and update UI
    saveBooks();
    updateBookProgress(bookId);
    updateStats();
}

// Record chapter read in daily progress
function recordChapterRead(bookId, chapter) {
    const today = new Date().toISOString().split('T')[0];
    const dailyProgress = JSON.parse(localStorage.getItem(DAILY_PROGRESS_KEY) || '{}');
    
    if (!dailyProgress[today]) {
        dailyProgress[today] = {
            count: 0,
            chapters: []
        };
    }
    
    // Add chapter to today's progress if not already recorded
    const chapterKey = `${bookId}-${chapter}`;
    if (!dailyProgress[today].chapters.includes(chapterKey)) {
        dailyProgress[today].chapters.push(chapterKey);
        dailyProgress[today].count++;
        
        // Remove old dates if more than MAX_DAYS_HISTORY
        const dates = Object.keys(dailyProgress).sort();
        if (dates.length > MAX_DAYS_HISTORY) {
            delete dailyProgress[dates[0]];
        }
        
        // Save progress and update UI
        localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(dailyProgress));
        updateDailyProgress();
        checkDailyGoalAchievement();
        
        // Check if daily goal is achieved
        const dailyGoal = parseInt(localStorage.getItem(DAILY_GOAL_KEY));
        if (dailyGoal && dailyProgress[today].count >= dailyGoal) {
            const goalStatus = document.querySelector('.daily-goal-status');
            goalStatus.classList.remove('hidden');
            goalStatus.classList.add('achieved');
            playAchievementSound();
            
            // Remove animation class after animation completes
            setTimeout(() => {
                goalStatus.classList.remove('achieved');
            }, 500);
        }
        
        // Update chart if visible
        if (!readingProgressContainer.classList.contains('hidden') && readingChart) {
            updateReadingChart();
        }
    }
}

// Mark all unread chapters as read today
function markReadToday(bookId) {
    const book = books.find(b => b.id === bookId);
    
    if (!book) return;
    
    let chaptersMarked = 0;
    
    // Mark all chapters as read
    for (let i = 0; i < book.totalChapters; i++) {
        const chapterNumber = i + 1;
        
        // Skip already read chapters
        if (book.readChapters.includes(chapterNumber)) {
            continue;
        }
        
        // Update chapter completion status
        if (!book.chapters[i]) {
            book.chapters[i] = { completed: true };
        } else {
            book.chapters[i].completed = true;
        }
        
        // Update readChapters array
        book.readChapters.push(chapterNumber);
        
        // Record chapter read for daily progress
        recordChapterRead(bookId, chapterNumber);
        chaptersMarked++;
    }
    
    // Sort readChapters array
    book.readChapters.sort((a, b) => a - b);
    
    // Save changes and update UI
    saveBooks();
    renderBooks();
    updateStats();
    
    // Show confirmation message
    if (chaptersMarked > 0) {
        alert(`Marked ${chaptersMarked} chapter${chaptersMarked > 1 ? 's' : ''} as read today.`);
    } else {
        alert('All chapters are already marked as read.');
    }
}

// Update book progress
function updateBookProgress(bookId) {
    const book = books.find(b => b.id === bookId);
    const bookCard = booksContainer.querySelector(`.book-card[data-id="${bookId}"]`);
    
    if (!book || !bookCard) return;
    
    const readChapters = book.readChapters.length;
    const progress = (readChapters / book.totalChapters) * 100;
    
    bookCard.querySelector('.progress').style.width = `${progress}%`;
    bookCard.querySelector('.progress-text').textContent = `${Math.round(progress)}%`;
    bookCard.querySelector('.read-chapters').textContent = readChapters;
}

// Delete book
function deleteBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    showConfirmationDialog(
        'Delete Book',
        `Are you sure you want to delete "${book.title}"?`,
        () => {
            const index = books.findIndex(b => b.id === bookId);
            
            if (index !== -1) {
                books.splice(index, 1);
                saveBooks();
                renderBooks();
                updateStats();
                updateGenreFilter();
            }
        }
    );
}

// Update statistics
function updateStats() {
    // Calculate total chapters read
    const totalChaptersRead = books.reduce((total, book) => total + book.readChapters.length, 0);
    totalChaptersReadElement.textContent = totalChaptersRead;
    
    // Calculate books in progress
    const booksInProgress = books.filter(book => 
        book.readChapters.length > 0 && book.readChapters.length < book.totalChapters
    ).length;
    booksInProgressElement.textContent = booksInProgress;
    
    // Calculate completed books
    const booksCompleted = books.filter(book => 
        book.readChapters.length === book.totalChapters
    ).length;
    booksCompletedElement.textContent = booksCompleted;
    
    // Update today's chapters
    updateDailyProgress();
}

// Update daily progress display
function updateDailyProgress() {
    const today = new Date().toISOString().split('T')[0];
    const dailyProgress = JSON.parse(localStorage.getItem(DAILY_PROGRESS_KEY) || '{}');
    const todayChapters = dailyProgress[today] ? dailyProgress[today].count : 0;
    
    todayChaptersReadElement.textContent = todayChapters;
    checkDailyGoalAchievement();
}

// Toggle reading progress chart
function toggleReadingProgressChart() {
    readingProgressContainer.classList.toggle('hidden');
    
    if (!readingProgressContainer.classList.contains('hidden')) {
        updateReadingChart();
    }
}

// Update reading progress chart
function updateReadingChart() {
    const dailyProgress = JSON.parse(localStorage.getItem(DAILY_PROGRESS_KEY) || '{}');
    const dates = Object.keys(dailyProgress).sort();
    const chaptersRead = dates.map(date => dailyProgress[date].count);
    
    // Format dates for display
    const formattedDates = dates.map(date => {
        const [year, month, day] = date.split('-');
        return `${month}/${day}`;
    });
    
    // Destroy existing chart if it exists
    if (readingChart) {
        readingChart.destroy();
    }
    
    // Create new chart
    const ctx = document.getElementById('progress-chart').getContext('2d');
    readingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: formattedDates,
            datasets: [{
                label: 'Chapters Read',
                data: chaptersRead,
                backgroundColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--primary-color'),
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--primary-color'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--chart-border')
                    }
                },
                x: {
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--chart-border')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Show confirmation dialog
function showConfirmationDialog(title, message, confirmCallback) {
    dialogTitle.textContent = title;
    dialogMessage.textContent = message;
    confirmationDialog.classList.remove('hidden');
    
    // Remove existing event listener and add new one
    dialogConfirmBtn.onclick = () => {
        confirmCallback();
        hideConfirmationDialog();
    };
}

// Hide confirmation dialog
function hideConfirmationDialog() {
    confirmationDialog.classList.add('hidden');
}

// Show reset confirmation
function showResetConfirmation() {
    showConfirmationDialog(
        'Reset App',
        'Are you sure you want to reset the app? This will delete all books and reading progress.',
        resetApp
    );
}

// Reset app
function resetApp() {
    // Clear all data
    books = [];
    localStorage.removeItem('books');
    localStorage.removeItem(DAILY_PROGRESS_KEY);
    localStorage.removeItem(DAILY_GOAL_KEY);
    
    // Reset UI
    renderBooks();
    updateStats();
    updateGenreFilter();
    dailyGoalInput.value = '';
    currentGoalDisplay.textContent = 'Not set';
    dailyGoalStatus.classList.add('hidden');
    
    // Hide reading progress if visible
    readingProgressContainer.classList.add('hidden');
}

// Function to restart reading a book
function restartReading(bookId) {
    showConfirmationDialog(
        'Restart Reading',
        'Do you want to start reading this book again? Your previous reading progress will be saved in history.',
        () => {
            const book = books.find(b => b.id === bookId);
            if (!book) return;
            
            // Save current reading session to history
            if (!book.readingHistory) {
                book.readingHistory = [];
            }
            
            book.readingHistory.push({
                session: book.currentReadingSession || 1,
                completedDate: new Date().toISOString(),
                readChapters: [...book.readChapters]
            });
            
            // Start new reading session
            book.readChapters = [];
            book.currentReadingSession = (book.currentReadingSession || 1) + 1;
            
            // Save and update UI
            saveBooks();
            renderBooks();
            updateStats();
        }
    );
}

// Reset form fields
function resetForm() {
    bookTitle.value = '';
    bookAuthor.value = '';
    bookChapters.value = '';
    bookGenre.value = '';
    previouslyReadCheckbox.checked = false;
    removeCoverImage();
    editingBookId = null;
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    initApp();
}); 