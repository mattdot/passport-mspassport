var UserDB = function(data) {
    this.users = data;
};

UserDB.prototype.findByPublicKey = function(pk, callback) {
    for (var id in this.users) {
        if (this.users.hasOwnProperty(id)) {
            var user = this.users[id];
            
            for (var key in user.credentials.keys) {
                if(key === pk) {
                    callback(user);  
                };
            }
        }
    }
};

UserDB.prototype.add = function(user) {
    this.users[user.username] = user;
};

module.exports = UserDB;