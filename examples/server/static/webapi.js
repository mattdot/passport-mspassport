"use strict";

((function($) {
    /*
     * @returns {boolean} true if browser supports Microsoft Passport; otherwise false
     */ 
    function passportAvailable() {
        return typeof(window.msCredentials) !== "undefined";
    }

    /*
     * Create a new passport credential
     * @param {string} userDisplayName
     * @param {string} userId
     */ 
    function makeCredential(userDisplayName, userId, callback) {
        try {
            window.msCredentials.makeCredential(
                { 
                    rpDisplayName : "Contoso",
                    userDisplayName : userDisplayName,
                    userId : userId
                },
                [
                    {
                        type: "FIDO_2_0",
                        algorithm: "RSASSA-PKCS1-v1_5"
                    },
                ]).then(
                function(assertion) { 
                    logAssertion(assertion);
                    if(callback) { 
                        callback(assertion);
                    }
                },
                function (e) { log("makeCredential() failed: " + e); }
            );
        } catch (ex) {
            log("makeCredential() failed: " + ex);
        }    
    }

    function logAssertion(assertion) {
        log("makeCredential() succeeded.");
        log("id: " + assertion.id);
        log("type: " + assertion.type);
        log("attestation: " + assertion.attestation);
        log("transportHints: " + assertion.transportHints);

        var publicKey = JSON.parse(assertion.publicKey);
        log("publicKey: ");
        for (var property in publicKey) {
            if (publicKey.hasOwnProperty(property)) {
                log(property + ": " + publicKey[property]);
            }
        }
    }

    function log(message) {
        if(console && console.log) {
            console.log(message);
        }
    }
    
    // { signatureParams : { userPrompt : "hello there" }, challenge : "", id: "" }
    function getAssertion(signatureParams, challenge, credential_id, callback) {
        try {
            window.msCredentials.getAssertion(
                challenge,
                {
                    accept:
                    [
                        {
                            type: "FIDO_2_0",
                            id: credential_id
                        }
                    ],
                },
                signatureParams
                ).then(
                    function(assertion) {
                        callback(assertion);
                        onAcquiredExistingAssertion(assertion);
                    }
                ,
                function (e) { log("getAssertion() failed: " + e); }
                );
        } catch (ex) {
            log("getAssertion() failed: " + ex);
        }    
    }

    function onAcquiredExistingAssertion(assertion) {
        log("getAssertion() succeeded.");
        log("id: " + assertion.id);
        log("type: " + assertion.type);
        log("clientData: " + assertion.signature.clientData);
        log("authnrData: " + assertion.signature.authnrData);
        log("signature: " + assertion.signature.signature);
    }

    function makeChallenge() {
        
    }

    function validateChallenge() {
        
    }
    
    function goToTab(tabId) {
        $(".tab-content .active").removeClass("active");
        $(tabId).addClass("active");
    }


    $(document).ready(function(event) { 
        // var root = document.getElementById("root");
        // root.innerText = passportAvailable() ? "Hello!" : "I can't say hello to you";
        $("#login_button").click(function(){
            if(passportAvailable()) {
                goToTab("#hello_enlist");
            } else {
                goToTab("#goodbye");
            }
        });
        
        $("#register_button").click(function() {
            if(passportAvailable()) {
                goToTab("#hello_register");
            } else {
                goToTab("#goodbye");
            }
        });
        
        $("#register_submit").click(function () {
            var username = $("#register_username").value;
            var displayName = $("#register_displayname").value;
            makeCredential(displayName, username, function (assertion) {
               console.log(assertion); 
            });
        });
        
        $("#use_hello").click(function(){
            console.log("getting challenge from server");
            var xhr = $.post("/auth/mspassport")
                .fail(function(res){
                    console.log(res.status);
                    console.log(res.statusCode());
                    if(403 === res.status) {
                        //get challenge from auth header
                    }
                })
                .done(function(data, status, res){
                    
                });
            //makeCredential("Jane Doe", "janedoe", function (assertion) {
            //   console.log(assertion); 
            //});
        });
    });
})(jQuery));
