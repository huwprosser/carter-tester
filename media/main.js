// when window is ready

window.onload = function () {
    // on id chat ElementInternals, fire chat function, "wZ2Awhj9S3aeMg09uIcoDxVKKKjYr8ao",
    var textInput = document.getElementById("chat");
    var textOutput = document.getElementById("output");
    var textRaw = document.getElementById("raw");
    var textSent = document.getElementById("sent");
    var status = document.getElementById("spin");
    var key = document.getElementById("key");
    var uuid = document.getElementById("uuid");
    var endpoint = document.getElementById("endpoint");

    function chat(e) {
        if (!key || !uuid) {
            return;
        }

        // if key was enter
        if (e.keyCode === 13 && endpoint) {
            var textToSend = JSON.stringify(
                {
                    api_key: key.value,
                    query: e.target.value,
                    uuid: uuid.value,
                },
                null,
                2
            );
            if (status !== null && textRaw !== null) {
                // display status div
                status.style.display = "block";
                textRaw.style.display = "none";
            }
            if (textSent !== null) {
                textSent.innerHTML = textToSend;
            }
            fetch(endpoint.value, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: textToSend,
            })
                .then((res) => res.json())
                .then((data) => {
                    if (textRaw !== null) {
                        textRaw.textContent = JSON.stringify(data, null, 2);
                        textRaw.style.display = "block";
                    }

                    if (textOutput !== null) {
                        textOutput.innerHTML = data.output.text;
                    }

                    if (status !== null) {
                        status.style.display = "none";
                    }
                });
        }
    }

    if (textInput) {
        textInput.addEventListener("keyup", chat);
    }
};
