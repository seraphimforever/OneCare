/* =========================================================
   ONECARE — FRONTEND INTERACTIONS
   ========================================================= */

/* ------------------------------
   Toast
-------------------------------- */

function showToast(message) {

    let toast = document.querySelector(".toast");

    if (!toast) {

        toast = document.createElement("div");

        toast.className = "toast";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}


/* ------------------------------
   Save forms
-------------------------------- */

function saveForm(formId, message = "Changes saved successfully.") {

    const form = document.getElementById(formId);

    if (!form) return;

    form.addEventListener("submit", function(event) {

        event.preventDefault();

        showToast(message);

    });
}


/* ------------------------------
   Cura floating chatbot
-------------------------------- */

function setupCura() {

    const button = document.querySelector(".cura-floating");

    const windowBox = document.querySelector(".cura-window");

    const close = document.querySelector(".cura-close");

    if (!button || !windowBox) return;

    button.addEventListener("click", () => {

        windowBox.classList.toggle("open");

    });

    if (close) {

        close.addEventListener("click", () => {

            windowBox.classList.remove("open");

        });

    }

}


/* ------------------------------
   Cura small chatbot
-------------------------------- */

function setupSmallCuraChat() {

    const input = document.querySelector(".cura-input input");

    const send = document.querySelector(".cura-input button");

    const messages =
        document.querySelector(".cura-messages");

    if (!input || !send || !messages) return;

    function sendMessage() {

        const text = input.value.trim();

        if (!text) return;

        const userMessage =
            document.createElement("div");

        userMessage.className =
            "message user";

        userMessage.textContent = text;

        messages.appendChild(userMessage);

        input.value = "";

        messages.scrollTop =
            messages.scrollHeight;

        setTimeout(() => {

            const botMessage =
                document.createElement("div");

            botMessage.className =
                "message bot";

            botMessage.textContent =
                "I'm still learning, but I can help you navigate your OneCare records. For medical advice, please speak with a qualified healthcare professional.";

            messages.appendChild(botMessage);

            messages.scrollTop =
                messages.scrollHeight;

        }, 700);
    }

    send.addEventListener(
        "click",
        sendMessage
    );

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                sendMessage();

            }

        }
    );

}


/* ------------------------------
   Main Cura AI
-------------------------------- */

function setupAIChat() {

    const input =
        document.querySelector(".ai-input input");

    const button =
        document.querySelector(".ai-input button");

    const messages =
        document.querySelector(".ai-messages");

    if (!input || !button || !messages) return;


    function addMessage(text, type) {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            `ai-message ${type}`;

        const bubble =
            document.createElement("div");

        bubble.className =
            "ai-message-bubble";

        bubble.textContent = text;

        wrapper.appendChild(bubble);

        messages.appendChild(wrapper);

        messages.scrollTop =
            messages.scrollHeight;

    }


    function respond(text) {

        const lower =
            text.toLowerCase();

        let response =
            "I can help you navigate OneCare, but I'm only a frontend demo right now.";

        if (
            lower.includes("appointment")
        ) {

            response =
                "You can manage your upcoming appointments from the Appointments section.";

        }

        else if (
            lower.includes("document") ||
            lower.includes("report")
        ) {

            response =
                "Your medical documents and uploaded reports can be viewed from Documents.";

        }

        else if (
            lower.includes("profile")
        ) {

            response =
                "You can update your personal information from your Profile.";

        }

        else if (
            lower.includes("history")
        ) {

            response =
                "Medical History lets you organise conditions, allergies, medications and other important information.";

        }

        else if (
            lower.includes("doctor")
        ) {

            response =
                "The Doctor Access area is designed for temporary, patient-controlled access using a one-time verification code.";

        }

        else if (
            lower.includes("hello") ||
            lower.includes("hi")
        ) {

            response =
                "Hey! 👋 I'm Cura, your OneCare companion. How can I help you today?";

        }

        setTimeout(() => {

            addMessage(
                response,
                "bot"
            );

        }, 600);

    }


    function sendMessage() {

        const text =
            input.value.trim();

        if (!text) return;

        addMessage(
            text,
            "user"
        );

        input.value = "";

        respond(text);

    }


    button.addEventListener(
        "click",
        sendMessage
    );


    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                sendMessage();

            }

        }
    );

}


/* ------------------------------
   Fake OTP generator
-------------------------------- */

function generateDemoOTP() {

    const otp =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    const output =
        document.getElementById("demoOTP");

    if (output) {

        output.textContent =
            otp;

    }

    showToast(
        "Demo one-time code generated."
    );

}


/* ------------------------------
   Start everything
-------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupCura();

        setupSmallCuraChat();

        setupAIChat();

    }
);