/* -------------------------------------------------------------------------- */
/*                      PLACEHOLDER CREDITS (THE GHOSTS)                      */
/* -------------------------------------------------------------------------- */

const placeholders = [
    { name: "Jay Tommy", role: "The Dreamer" },
    { name: "Ophelia Duckings", role: "The Tragic Lover" },
    { name: "Werther Miller", role: "Freckled girl", song: "Creep - Radiohead", note: "You gave me strength." },
    { name: "Echo Batsky", role: "The Voice", song: "Dreams - Fleetwood Mac", note: "I'll always remember your kind words." },
    { name: "Dante Burtis", role: "The Pilgrim", song: "Video Games - Lana del Rey", note: "This was possible thanks to you." },
    { name: "Orpheus Lee", role: "Salesman" },
    { name: "Helga Pataki", role: "Woman in pink" },
    { name: "Michael Reeds", role: "Construction Worker" },
    { name: "Stefano Rossi", role: "Poet on the street", song: "Mad World - Tears for Fears", note: "Great skills and a keen eye for detail." },
    { name: "Fantine Pluck", role: "The Martyr" },
];

/* -------------------------------------------------------------------------- */
/*                    HTML SECTIONS SCROLLING FADING EFFECT                   */
/* -------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    // Select all sections inside the welcome page
    const sections = document.querySelectorAll('#welcome-page section');

    // Create the observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // If the section is in view
            if (entry.isIntersecting) {
                // Add the class that makes it visible (opacity: 1)
                entry.target.classList.add('visible');
            } else {
                // Remove class to make it fade out again when you scroll away
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.3 // Trigger when 30% of the section is visible
    });

    // Tell observer to watch every section
    sections.forEach(section => {
        observer.observe(section);
    });
});

window.addEventListener('load', function () {

    /* -------------------------------------------------------------------------- */
    /*                              GLOBAL VARIABLES                              */
    /* -------------------------------------------------------------------------- */

    let nameForm = document.getElementById('name');
    let roleForm = document.getElementById('role');
    let noteForm = document.getElementById('note');
    let songForm = document.getElementById('song');
    let hide = document.getElementById('hide');
    let submitButton = document.getElementById('submit-button');
    let goButton = document.getElementById('goButton');
    const creditsPage = document.querySelectorAll(".endcreditsPage");

    /* -------------------------------------------------------------------------- */
    /*                         LOAD CREDITS FROM DATABASE                         */
    /* -------------------------------------------------------------------------- */

    function loadCredits() {
        fetch('/submissions')
            .then(response => response.json())
            .then(data => {
                console.log('Loaded submissions:', data);

                // GET REAL SUBMISSIONS FROM DATABASE
                let realSubmissions = data.data;
                // LOGIC: MERGE REAL SUBMISSIONS AND PLACEHOLDERS
                //I want the credits to always look full
                const minCredits = 15;

                // Start the final list with the Real submissions
                let finalCreditsList = [];

                // Add all real submissions first (so users see themselves at the top)
                for (let i = 0; i < realSubmissions.length; i++) {
                    finalCreditsList.push(realSubmissions[i]);
                }

                // Calculate how many placeholders I need.
                let placeholdersNeeded = minCredits - realSubmissions.length;

                // If I need placeholders, grab them from the local array
                if (placeholdersNeeded > 0) {
                    for (let i = 0; i < placeholdersNeeded; i++) {
                        // Use the modulo operator (%) to loop the placeholder list. If we need more ghosts than we have defined then they will start to repeat.
                        let ghost = placeholders[i % placeholders.length];
                        finalCreditsList.push(ghost);
                    }
                }
                // Get the container where credits will appear
                let creditsList = document.getElementById('credits-list');

                // Clear any existing content
                creditsList.innerHTML = '';

                // Add opening title
                let title = document.createElement('h1');
                title.innerHTML = 'End Credits';
                creditsList.appendChild(title);

                /* ---------------- Credits Section 1: Cast (names and roles) --------------- */

                // Create Section Header
                let castHeader = document.createElement('h2');
                castHeader.innerHTML = 'CAST';
                creditsList.appendChild(castHeader);

                // Loop strictly for Names and Roles
                for (let i = 0; i < finalCreditsList.length; i++) {
                    let submission = finalCreditsList[i];

                    // Create the row container
                    let castRow = document.createElement('div');
                    castRow.className = 'credit-row'; // We will use this class for CSS later

                    // Create the Role Span (Left side)
                    let roleSpan = document.createElement('span');
                    roleSpan.className = 'role';
                    roleSpan.innerHTML = submission.role;

                    // Create the Dots Span (Middle)
                    let dotsSpan = document.createElement('span');
                    dotsSpan.className = 'dots';
                    dotsSpan.innerHTML = ' ....................... ';

                    // Create the Name Span (Right side)
                    let nameSpan = document.createElement('span');
                    nameSpan.className = 'name';
                    nameSpan.innerHTML = submission.name;

                    // Append them in order: Role -> Dots -> Name
                    castRow.appendChild(roleSpan);
                    castRow.appendChild(dotsSpan);
                    castRow.appendChild(nameSpan);

                    // Add the row to the main list
                    creditsList.appendChild(castRow);
                }
                // Add a spacer after the cast section
                let spacer1 = document.createElement('div');
                spacer1.style.height = '100px';
                creditsList.appendChild(spacer1);

                /* ------------------------ Credits section 2: Songs ------------------------ */

                let musicHeader = document.createElement('h2');
                musicHeader.innerHTML = 'SOUNDTRACK';
                creditsList.appendChild(musicHeader);

                // Loop 2: Go through all data again, just for Songs
                for (let i = 0; i < finalCreditsList.length; i++) {
                    let submission = finalCreditsList[i];

                    // Only run this code if a song exists
                    if (submission.song) {
                        let songRow = document.createElement('div');
                        songRow.className = 'song-row';

                        let songText = document.createElement('p');
                        songText.innerHTML = '♪ ' + submission.song;

                        songRow.appendChild(songText);
                        creditsList.appendChild(songRow);
                    }
                }

                // Add a spacer after the songs
                let spacer2 = document.createElement('div');
                spacer2.style.height = '100px';
                creditsList.appendChild(spacer2);

                /* ------------------- Credits section 3: Thank You Notes ------------------- */

                let noteHeader = document.createElement('h2');
                noteHeader.innerHTML = 'SPECIAL THANKS';
                creditsList.appendChild(noteHeader);

                // Loop 3: Go through all data one last time for Notes
                for (let i = 0; i < finalCreditsList.length; i++) {
                    let submission = finalCreditsList[i];

                    // Only run this if a note exists
                    if (submission.note) {
                        let noteRow = document.createElement('div');
                        noteRow.className = 'note-container';
                        noteRow.style.marginBottom = '30px';

                        // The Author Name (who wrote the note)
                        let noteAuthor = document.createElement('span');
                        noteAuthor.innerHTML = submission.name + ' - ';

                        // The Note Text
                        let noteText = document.createElement('span');
                        noteText.innerHTML = submission.note;

                        noteRow.appendChild(noteAuthor);
                        noteRow.appendChild(noteText);
                        creditsList.appendChild(noteRow);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading credits:', error);
            });
    }

    /* -------------------------------------------------------------------------- */
    /*                              PAGE TRANSITIONS                              */
    /* -------------------------------------------------------------------------- */

    // Transition to end credits and submission form when the "Let's Go" button is clicked
    goButton.addEventListener('click', function (event) {
        event.preventDefault();
        document.body.style.backgroundColor = '#07020aff';
        document.body.style.color = '#ffffff';
        document.getElementById('button').style.display = 'none';
        document.getElementById('welcome-page').style.display = 'none';
        showHide();

        // Load all submissions into the credits
        loadCredits();
    });

    function showHide() {
        creditsPage.forEach(page => {
            page.classList.toggle("showing");
        })
    }
    /* -------------------------------------------------------------------------- */
    /*                   SEND INFORMATION TO THE SERVER DATABASE                  */
    /* -------------------------------------------------------------------------- */
    submitButton.addEventListener('click', function (event) {
        event.preventDefault();

        let formData = {
            name: nameForm.value,
            role: roleForm.value,
            note: noteForm.value,
            song: songForm.value,
            hide: hide.checked
        };
        let jsonData = JSON.stringify(formData);

        fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonData
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);

                // Clear the form
                nameForm.value = '';
                roleForm.value = '';
                noteForm.value = '';
                songForm.value = '';
                hide.checked = false;

                // Show success message
                alert('Thank you for your submission! Your credit has been added.');
                
                // Reload the credits to show the new submission
                loadCredits();
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('There was an error submitting your form. Please try again.');
            });
    });
});