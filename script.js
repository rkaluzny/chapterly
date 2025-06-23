// Book Reading App - Main Script

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

    loadBooks();
    renderBooks();
    updateStats();
    initDarkMode();
    initSortable();
    initFilters();
    initDailyGoal();
    updateDailyProgress();
    addEventListeners();
    
    console.log('App initialization completed');
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
    // Status filter
    statusFilter.addEventListener('change', applyFilters);
    
    // Genre filter
    genreFilter.addEventListener('change', applyFilters);
    
    // Populate genre filter with unique genres from books
    updateGenreFilter();
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
        
        bookCard.style.display = showBook ? '' : 'none';
    });
    
    // Show/hide no books message
    const visibleBooks = booksContainer.querySelectorAll('.book-card[style=""]').length;
    noBookMessage.style.display = visibleBooks === 0 ? '' : 'none';
    if (visibleBooks === 0) {
        noBookMessage.textContent = 'No books found with the selected filters.';
    }
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
    // Validate input
    if (!bookTitle.value.trim()) {
        alert('Please enter a book title.');
        bookTitle.focus();
        return;
    }
    
    if (!bookAuthor.value.trim()) {
        alert('Please enter an author name.');
        bookAuthor.focus();
        return;
    }
    
    if (!bookChapters.value || bookChapters.value < 1) {
        alert('Please enter a valid number of chapters (minimum 1).');
        bookChapters.focus();
        return;
    }
    
    if (!bookGenre.value) {
        alert('Please select a genre.');
        bookGenre.focus();
        return;
    }

    const totalChapters = parseInt(bookChapters.value);
    const isPreviouslyRead = previouslyReadCheckbox.checked;
    
    const book = {
        id: editingBookId || generateId(),
        title: bookTitle.value.trim(),
        author: bookAuthor.value.trim(),
        totalChapters: totalChapters,
        genre: bookGenre.value,
        coverImage: selectedCoverImage,
        readChapters: isPreviouslyRead ? Array.from({length: totalChapters}, (_, i) => i + 1) : [],
        readingHistory: [],
        currentReadingSession: 1
    };
    
    if (editingBookId) {
        // Update existing book
        const index = books.findIndex(b => b.id === editingBookId);
        if (index !== -1) {
            // Preserve reading history and session if exists
            if (books[index].readingHistory) {
                book.readingHistory = books[index].readingHistory;
                book.currentReadingSession = books[index].currentReadingSession;
            }
            books[index] = book;
        }
    } else {
        // Add new book
        books.push(book);
    }
    
    // Save and update UI
    saveBooks();
    renderBooks();
    updateStats();
    updateGenreFilter();
    hideAddBookForm();
}

// Render all books
function renderBooks() {
    // Clear container
    while (booksContainer.firstChild) {
        booksContainer.removeChild(booksContainer.firstChild);
    }
    
    // Show message if no books
    if (books.length === 0) {
        noBookMessage.style.display = '';
        noBookMessage.textContent = 'No books added yet. Click "Add New Book" to get started.';
        booksContainer.appendChild(noBookMessage);
        return;
    }
    
    // Hide message and render books
    noBookMessage.style.display = 'none';
    books.forEach(book => renderBook(book));
    
    // Apply current filters
    applyFilters();
}

// Render single book
function renderBook(book) {
    const bookElement = bookTemplate.content.cloneNode(true);
    const bookCard = bookElement.querySelector('.book-card');
    
    // Set book ID and genre
    bookCard.dataset.id = book.id;
    bookCard.dataset.genre = book.genre;
    
    // Set title and author
    bookCard.querySelector('.book-title').textContent = book.title;
    bookCard.querySelector('.book-author').textContent = `by ${book.author}`;
    
    // Set genre tag
    const genreTag = bookCard.querySelector('.book-genre');
    genreTag.textContent = getGenreName(book.genre);
    genreTag.dataset.genre = book.genre;
    
    // Set cover image or default icon
    const coverElement = bookCard.querySelector('.book-cover');
    coverElement.dataset.genre = book.genre;
    
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
    
    // Update progress
    const readChapters = book.readChapters.length;
    const progress = (readChapters / book.totalChapters) * 100;
    
    bookCard.querySelector('.progress').style.width = `${progress}%`;
    bookCard.querySelector('.progress-text').textContent = `${Math.round(progress)}%`;
    bookCard.querySelector('.read-chapters').textContent = readChapters;
    bookCard.querySelector('.total-chapters').textContent = book.totalChapters;
    
    // Add chapters list
    const chaptersContainer = bookCard.querySelector('.chapters-container');
    
    // Add restart reading button if book is completed
    if (readChapters === book.totalChapters) {
        const restartButton = document.createElement('button');
        restartButton.className = 'restart-reading-btn';
        restartButton.innerHTML = '<i class="fas fa-redo"></i> Start Reading Again';
        restartButton.addEventListener('click', () => restartReading(book.id));
        chaptersContainer.appendChild(restartButton);
    }
    
    // Add chapter checkboxes
    for (let i = 1; i <= book.totalChapters; i++) {
        const chapterItem = document.createElement('div');
        chapterItem.className = 'chapter-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'chapter-checkbox';
        checkbox.checked = book.readChapters.includes(i);
        checkbox.dataset.chapter = i;
        checkbox.addEventListener('change', (e) => toggleChapterRead(e, book.id));
        
        const label = document.createElement('label');
        label.textContent = `Chapter ${i}`;
        
        chapterItem.appendChild(checkbox);
        chapterItem.appendChild(label);
        chaptersContainer.appendChild(chapterItem);
    }
    
    // Add event listeners
    bookCard.querySelector('.edit-chapters-btn').addEventListener('click', () => {
        toggleChapters(book.id);
    });
    
    bookCard.querySelector('.mark-read-btn').addEventListener('click', () => {
        markReadToday(book.id);
    });
    
    bookCard.querySelector('.delete-book-btn').addEventListener('click', () => {
        showConfirmationDialog(
            'Delete Book',
            `Are you sure you want to delete "${book.title}"?`,
            () => deleteBook(book.id)
        );
    });
    
    booksContainer.appendChild(bookElement);
}

// Toggle chapters list
function toggleChapters(bookId) {
    const bookCard = booksContainer.querySelector(`.book-card[data-id="${bookId}"]`);
    const chaptersContainer = bookCard.querySelector('.chapters-container');
    chaptersContainer.classList.toggle('hidden');
}

// Toggle chapter read status
function toggleChapterRead(event, bookId) {
    const chapter = parseInt(event.target.dataset.chapter);
    const book = books.find(b => b.id === bookId);
    
    if (!book) return;
    
    if (event.target.checked) {
        // Mark chapter as read
        if (!book.readChapters.includes(chapter)) {
            book.readChapters.push(chapter);
            book.readChapters.sort((a, b) => a - b);
            recordChapterRead(bookId, chapter);
        }
    } else {
        // Mark chapter as unread
        const index = book.readChapters.indexOf(chapter);
        if (index !== -1) {
            book.readChapters.splice(index, 1);
        }
    }
    
    // Update UI
    saveBooks();
    updateBookProgress(bookId);
    updateStats();
    applyFilters();
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
    
    // Get unread chapters
    const unreadChapters = Array.from(
        { length: book.totalChapters },
        (_, i) => i + 1
    ).filter(chapter => !book.readChapters.includes(chapter));
    
    if (unreadChapters.length === 0) {
        alert('All chapters have already been read!');
        return;
    }
    
    // Mark all unread chapters as read
    unreadChapters.forEach(chapter => {
        book.readChapters.push(chapter);
        recordChapterRead(bookId, chapter);
    });
    
    book.readChapters.sort((a, b) => a - b);
    
    // Update UI
    saveBooks();
    renderBooks();
    updateStats();
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
    const index = books.findIndex(b => b.id === bookId);
    
    if (index !== -1) {
        books.splice(index, 1);
        saveBooks();
        renderBooks();
        updateStats();
        updateGenreFilter();
    }
    
    hideConfirmationDialog();
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    initApp();
}); 