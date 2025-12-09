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
/*                              GLOBAL VARIABLES                              */
/* -------------------------------------------------------------------------- */
var audio = new Audio('/sounds/limerence.m4a')
let nameForm = document.getElementById('name');
let roleForm = document.getElementById('role');
let noteForm = document.getElementById('note');
let songForm = document.getElementById('song');
let hide = document.getElementById('hide');
let submitButton = document.getElementById('submit-button');
let goButton = document.getElementById('goButton');
const creditsPage = document.querySelectorAll(".endcreditsPage");
let hasSubmitted = false; // Track if user has submitted

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
                    dotsSpan.innerHTML = ' .............................................. ';

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

                if (hasSubmitted) {
                    // Add spacer before playlist
                    let spacer4 = document.createElement('div');
                    spacer4.style.height = '100px';
                    creditsList.appendChild(spacer4);

                    let playlistHeader = document.createElement('h2');
                    playlistHeader.innerHTML = 'A PLAYLIST FOR YOU';
                    creditsList.appendChild(playlistHeader);

                    let playlistInvite = document.createElement('p');
                    playlistInvite.innerHTML = "Here's a playlist collecting the collective submissions' songs: ";

                    let playlistLink = document.createElement('a');
                    playlistLink.href = 'https://open.spotify.com/playlist/3Dozjx4nvzvK7d3bfG8t0A?si=K4CABoDXSGKEuFiCYuHAqg';
                    playlistLink.innerHTML = 'A Playlist to move on from limerence by listening to limerent songs';
                    playlistLink.target = '_blank';
                    playlistLink.rel = 'noopener noreferrer';

                    playlistInvite.appendChild(playlistLink);
                    creditsList.appendChild(playlistInvite);
                }
            })
            .catch(error => {
                console.error('Error loading credits:', error);
            });
    }


    /* -------------------------------------------------------------------------- */
    /*                              PAGE TRANSITIONS                              */
    /* -------------------------------------------------------------------------- */

    let intButton = document.getElementById('intButton'); // This is the "Let's Begin" button that takes you to the intermission stage
    // TRANSITION: Welcome Page -> Intermission
    if (intButton) {
        intButton.addEventListener('click', function (event) {
            event.preventDefault();

            // Hide Welcome Page
            document.getElementById('welcome-page').style.display = 'none';

            // Show Intermission
            let intermission = document.getElementById('final-prompt');
            intermission.style.display = 'flex';
            intermission.style.flexDirection = 'column';
            intermission.style.justifyContent = 'center';
            intermission.style.alignItems = 'center';

            // Change background to dark prussian blue immediately for the "Lull"
            let button = document.getElementById('goButton');
            document.body.style.backgroundColor = '#05111a';
            document.body.style.color = '#b0c4de';
            button.style.color = '#b0c4de';
            // TRIGGER THE SEQUENCE
            // We select the specific elements we want to fade in order
            const contentDiv = document.querySelector('.intermission-content');

            // Order of appearance: 
            // Title -> Paragraph -> List Items (one by one) -> Note -> Button

            const title = contentDiv.querySelector('h1');
            const mainText = contentDiv.querySelector('p');
            const listItems = contentDiv.querySelectorAll('li');
            const smallText = contentDiv.querySelector('.small');
            const readyButton = contentDiv.querySelector('#button');

            // Helper function for delay
            const fadeIn = (element, delay) => {
                setTimeout(() => {
                    element.classList.add('fade-in-active');
                }, delay);
            };

            // Adjust ms to change speed of sequence
            let timer = 500; // Start after 0.5s

            fadeIn(title, timer);

            timer += 3000; // +3 seconds later
            fadeIn(mainText, timer);

            // Loop through list items
            timer += 3000;
            listItems.forEach((li) => {
                fadeIn(li, timer);
                timer += 1000; // +1 second per list item
            });

            timer += 1000;
            fadeIn(smallText, timer);

            timer += 1500;
            fadeIn(readyButton, timer);
        });
    }

    // TRANSITION: Intermission -> End Credits
    if (goButton) {
        goButton.addEventListener('click', function (event) {
            event.preventDefault();
            document.body.style.color = '#fefefe';
            // // START MUSIC
            // audio.loop = true;
            // audio.volume = 0.3;
            // audio.play().catch(error => {
            //     console.log('Audio playback failed:', error);
            // });
            // Hide Intermission
            document.getElementById('final-prompt').style.display = 'none';
            // Show End Credits & Form
            showHide(); // Triggers the .showing class on .endcreditsPage elements
            // Load all submissions into the credits
            loadCredits();
        });
    }

    function showHide() {
        creditsPage.forEach(page => {
            // Force display block first so opacity transition works
            page.style.display = 'flex';

            // Small delay to allow browser to register 'display' before changing 'opacity'
            setTimeout(() => {
                page.classList.add("showing");
            }, 10);
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

                // TRIGGER THE 3D COLLAPSE
                if (window.triggerCollapse) {
                    window.triggerCollapse();
                }

                // Show success message
                alert('Thank you for your submission! Your credit has been added.');

                // SET THE FLAG - this tells loadCredits() to show the playlist
                hasSubmitted = true;

                // Reload the credits to show the new submission
                loadCredits();
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('There was an error submitting your form. Please try again.');
            });
    });
});