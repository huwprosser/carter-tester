// when window is ready

window.onload = function () {
    // on id chat ElementInternals, fire chat function
    var textInput = document.getElementById("chat");
    var textOutput = document.getElementById("output");
    var textRaw = document.getElementById("raw");
    var textSent = document.getElementById("sent");

    function chat(e) {
        if (textOutput !== null) {
            // if key was enter
            if (e.keyCode === 13) {
                textOutput.innerHTML = "Loading...";
                if (textSent !== null) {
                    textSent.innerHTML = JSON.stringify(
                        {
                            api_key: "wZ2Awhj9S3aeMg09uIcoDxVKKKjYr8ao",
                            query: e.target.value,
                            uuid: "user-id-123",
                        },
                        null,
                        2
                    );
                }
                fetch("https://api.carterapi.com/v0/chat", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        api_key: "wZ2Awhj9S3aeMg09uIcoDxVKKKjYr8ao",
                        query: e.target.value,
                        uuid: "user-id-123",
                    }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (textRaw !== null) {
                            textRaw.textContent = JSON.stringify(data, null, 2);
                        }

                        if (textOutput !== null) {
                            textOutput.innerHTML = data.output.text;
                        }
                    });
            }
        }
    }

    if (textInput) {
        textInput.addEventListener("keyup", chat);
    }
};
