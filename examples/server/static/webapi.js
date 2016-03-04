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


    $(document).ready(function(event) { 
        // var root = document.getElementById("root");
        // root.innerText = passportAvailable() ? "Hello!" : "I can't say hello to you";
        $("#login_button").click(function(){
            
        });
        
        $("#register_button").click(function() {
            if(passportAvailable()) {
                
            }
        });
        
        $("#use_hello").click(function(){
            makeCredential("Jane Doe", "janedoe", function (assertion) {
               console.log(assertion); 
            });
        });
    });
})(jQuery));
