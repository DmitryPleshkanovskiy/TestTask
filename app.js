var Application = {};

// Default users

var defaultUsers = [
    {
        id: 0,
        username: "John",
        birthday: "06.07.2008",
        city: "Budapest",
        active: true,
        boss: false
    },
    {
        id: 1,
        username: "Mary",
        birthday: "01.02.2003",
        city: "Berlin",
        active: true,
        boss: true
    },
    {
        id: 2,
        username: "James",
        birthday: "04.05.2006",
        city: "Vienna",
        active: false,
        boss: false
    }
];

var setDefaultLocalStorage = function() {
    if (!localStorage.getItem("users")) {
        localStorage.setItem("users", JSON.stringify(defaultUsers));
    };
};

(function(Application, $) {

    // Navigation

    Application.Navigation = {}

    Application.Navigation.init = function() {
        this.currentPage = 'dashboard';
        this.pagesList = ['dashboard', 'profile', 'edit-profile'];
        if(!location.hash) {
            location.hash = '#dashboard';
        }
        window.addEventListener('hashchange', Application.Navigation.onHashChange.bind(this));
    } 

    Application.Navigation.onHashChange = function() {
        this.page = location.hash.substr(1);
        if (this.canOpenPage(this.page)) {
            this.openPage(this.page);
        }
    }

    Application.Navigation.navigate = function(link) {
        if (location.hash == link) {
            this.onHashChange();
        } else {
            location.hash = link;
        }
    }

    Application.Navigation.canOpenPage = function(page) {
        if (Application.Navigation.pagesList.indexOf(page) > -1) {
        switch (page) {
            case 'dashboard': 
                return true;
            case 'profile': 
                if (Application.Users.selectedUserId > -1) {
                    return true;
                }
            case 'edit-profile':
                if (Application.Users.selectedUserId > -1) {
                    return true;
                }
            default: true;
            }
        }        
        return false;
    }

    Application.Navigation.openPage = function(page) {
        Application.NavigationBar.selectNavItem(page);
        this.currentPage = page;
        Application.renderPage();
    }

    // NavigationBar

    Application.NavigationBar = {};
    Application.NavigationBar.init = function() {
       this.$rootElement = $('#navigation-bar')
    }

    Application.NavigationBar.onClick = function(e) {
        if (e.target.hasAttribute('data-navigate')) {
            switch (e.target.getAttribute('data-navigate')) {
                case 'dashboard': 
                    Application.Navigation.navigate('#dashboard'); 
                    break;
                case 'profile':
                    if (Application.selectedUserId > -1) {
                        Application.Navigation.navigate('#profile');
                    }  
                    break;
            }
        }       
    }

    Application.NavigationBar.selectNavItem = function(page) {
        if (Application.Navigation.pagesList.indexOf(page) != -1) {
            if (page == 'edit-profile') {
                page = 'profile';
            } 
            this.$rootElement.find("li.active").removeClass("active");
            this.$rootElement.find("li a[data-navigate="+page+"]").closest("li").addClass("active");
        }
    }

    // Users

    Application.Users = {};

    Application.Users.init = function() {
        this.selectedUserId = -1;
        this.userList = [];

        // Setting default users
        if (!localStorage.getItem("users")) {
            setDefaultLocalStorage();
        }

        if (localStorage.getItem("users")) {
            this.userList = JSON.parse(localStorage.getItem("users"));
        }
    }

    Application.Users.showUserList = function() {
        $('#userlist tbody').empty();
        for (var i=0; i<this.userList.length; i++) {
            var user = this.userList[i];
            var isActive = '';
            var isBoss ='';
            user.active ? isActive = 'checked' : '';
            user.boss ? isBoss = 'checked' : '';
            $('#userlist tbody').append('<tr data-action="select-user" data-user-id="' + user.id + '"><td>' + (i+1) + '</td><td>' + user.username + '</td><td>' + user.birthday + '</td><td>' + user.city + '</td><td><input type="checkbox"' + isActive + ' disabled></td><td><input type="radio" name="boss"' + isBoss + ' disabled></td>');
        }
    }

    Application.Users.selectUser = function(e) {
        if (e.target.closest('[data-action]').hasAttribute('data-user-id')) {
            this.selectedUserId = e.target.closest('[data-action]').getAttribute('data-user-id');
            Application.Navigation.navigate('#profile'); 
            this.showUserProfile();
        }
    }

    Application.Users.showUserProfile = function() {
        var selectedUser = this.getSelectedUser();
        var $profile = $('#profile'); 
        $profile.find('[data-content="username"]').text(selectedUser.username);
        $profile.find('[data-content="birthday"]').text(selectedUser.birthday);
        $profile.find('[data-content="city"]').text(selectedUser.city);
    }

    Application.Users.getSelectedUser = function() {
        for (var i=0; i<this.userList.length; i++) {
             if (this.userList[i].id == this.selectedUserId) {
                return this.userList[i];
            }
        }
    }

    Application.Users.updateProfile = function(id, username, birthday, city) {
        for (var i=0; i<this.userList.length; i++) {
             if (this.userList[i].id == id) {
                this.userList[i].username = username;
                this.userList[i].birthday = birthday;
                this.userList[i].city = city;
                break;
            }
        }
        this.saveToLocalStorage();
    }

    Application.Users.saveToLocalStorage = function() {
        localStorage.setItem("users", JSON.stringify(this.userList));
    }

    // Profile editing 

    Application.Edit = {};

    Application.Edit.init = function() {
        Application.Navigation.navigate('#edit-profile');
        var selectedUser = Application.Users.getSelectedUser();

        this.$rootElement = $('#edit-profile');
        this.$usernameInput = this.$rootElement.find('[data-content="username-input"]');
        this.$birthdayInput = this.$rootElement.find('[data-content="birthday-input"]');
        this.$cityInput = this.$rootElement.find('[data-content="city-input"]'); 

        this.$rootElement.find('[data-content="username"]').text(selectedUser.username);
        this.$usernameInput.val(selectedUser.username);
        this.$birthdayInput.val(selectedUser.birthday);
        this.$cityInput.val(selectedUser.city);
    }

    Application.Edit.onSaveChanges = function() {
        var id = Application.Users.selectedUserId; 
        var username = this.$usernameInput.val();
        var birthday = this.$birthdayInput.val();
        var city = this.$cityInput.val();

        Application.Users.updateProfile(id, username, birthday, city);

        Application.Users.showUserList();
        Application.Users.selectedUserId = -1;
        Application.Navigation.navigate('#dashboard');
    }

    // Main app 

    Application.init = function(document) {

        this.Navigation.init();
        this.NavigationBar.init();
        this.Users.init();
        
        $container = $('#container');
        $container.click($.proxy(this.containerOnClick, this));

        this.Users.showUserList();
    };

    Application.containerOnClick = function(e) {
        var $element = e.target.closest('[data-action]');
        if ($element && $element.hasAttribute('data-action')) {
			switch($element.getAttribute('data-action')) {
				case 'select-user': this.Users.selectUser(e); break;
				case 'nav-bar-click': this.NavigationBar.onClick(e); break;
				case 'edit-profile': this.Edit.init(); break;
                case 'save-edited-profile': this.Edit.onSaveChanges(); break;
			}
        }
    }

    Application.renderPage = function() {
        $('section').removeClass('active-section');
        $('section#' + this.Navigation.currentPage).addClass('active-section');
    }

})(Application, jQuery);