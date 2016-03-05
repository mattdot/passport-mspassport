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

    function getChallenge(callback) {
        return $.post("/auth/mspassport")
        .fail(function(res){
            console.log(res.status);
            if(401 === res.status) {
                //get challenge from auth header
                var auth = res.getResponseHeader("WWW-Authenticate");
                console.log(auth);
                var rx = /challenge="([a-zA-Z0-9/+=]+)"/gi;
                var m = rx.exec(auth);
                if (m.length === 2) {
                    callback(m[1]);
                } else {
                    callback();
                }
            }
        })
        .done(function(data, status, res){
            callback();
        });
    }
    
    function sendAssertion(publicKey, challenge, signature, callback) {
        var authHeader = 'MSPassport' 
            + ' public_key="' + publicKey + '"'
            + ' challenge="' + challenge + '"'
            + ' signature="' + signature + '"';
            
        return $.ajax({
                type: "POST",
                url: "/auth/mspassport",
                beforeSend: function(req) { 
                    req.setRequestHeader('Authorization', authHeader); 
                } 
        }).fail(function(res){
            callback(false);
        }).done(function (data,status,res) {
            callback(true, data); // token is in data
        });
    }

    /* 
     *
     * 
     */ 
    function authenticate(callback) {
        // (1) get the challenge nonce from the server
        getChallenge(function(challenge){
            if(!challenge) {
                callback(false);
                return;
            }
            var username = localStorage.getItem("lastUsername");
            
            // (2) sign the nonce using passport/hello
            getAssertion({ userPrompt : "Hello there"}, challenge, username, function (assertion) {
                if(!assertion) {
                    callback(false);
                    return;
                }
                
                // (3) send the public key, challenge, and signature 
                // back up to the server to get an access token
                sendAssertion("",challenge, assertion.signature.signature, function(success, token){
                    
                });
            });
        });
    }
    
    function goToTab(tabId) {
        $(".tab-content .active").removeClass("active");
        $(tabId).addClass("active");
    }


    $(document).ready(function(event) { 
        
        if(localStorage.getItem("lastPublicKey")) {
            $("#hello_login_name").text(localStorage.getItem("lastDisplayName"));
            goToTab("#hello_login");
        }
        
        
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
            var username = $("#register_username")[0].value;
            var displayName = $("#register_displayname")[0].value;
            
            // (1) make a key credential for this user
            makeCredential(displayName, username, function (assertion) {
               console.log(assertion); 
               
               // (2) send registration details to server
               
               // (3) save some info locally to help login the user next time
               localStorage.setItem("lastUsername", username);
               localStorage.setItem("lastDisplayName", displayName);
               localStorage.setItem("lastPublicKey", assertion.publicKey); //todo
                
                // (4) go to loggedIn Tab;
                goToTab("#logged_in");
            });
        });
        
        $("#use_hello").click(function(){
            //makeCredential("Jane Doe", "janedoe", function (assertion) {
            //   console.log(assertion); 
            //});
        });
        
        $("#hello_login_button").click(function () {
            authenticate(function(success) {
                if(success) {
                    goToTab("#logged_in");
                }
            });
        });
        $("#not_me").click(function () {
            localStorage.clear();
            goToTab("#classic_login");
        })
    });
})(jQuery));
