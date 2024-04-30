document.addEventListener("DOMContentLoaded", function () {
    var chatHub = new signalR.HubConnectionBuilder()
        .withUrl("/chatHub")
        .build();

    var $sendBtn = document.getElementById('btnSend');
    var $msgTxt = document.getElementById('txtMsg');
    var messagesElement = document.getElementById('messages');
    var usersElement = document.getElementById('users').getElementsByTagName('ul')[0];

    var viewModel = {
        messages: [],
        users: [],
        isInPrivateChat: false,
        privateChatUser: null
    };

    chatHub.on("received", function (message) {
        viewModel.messages.push({ from: message.sender, message: message.message, isPrivate: message.isPrivate });
        updateMessages();
    });

    chatHub.on("userConnected", function (username) {
        viewModel.users.push({ name: username, isPrivateChatUser: false });
        updateUsers();
    });

    chatHub.on("userDisconnected", function (username) {
        viewModel.users = viewModel.users.filter(user => user.name !== username);
        if (viewModel.isInPrivateChat && viewModel.privateChatUser === username) {
            viewModel.isInPrivateChat = false;
            viewModel.privateChatUser = null;
        }
        updateUsers();
    });

    startConnection();

    function startConnection() {
        chatHub.start().then(function () {
            toggleInputs(false);
            bindClickEvents();
            $msgTxt.focus();
            chatHub.invoke("getConnectedUsers").then(function (users) {
                users.forEach(function (username) {
                    viewModel.users.push({ name: username, isPrivateChatUser: false });
                });
                updateUsers();
            });
        }).catch(function (err) {
            console.log(err);
        });
    }

    function bindClickEvents() {
        $msgTxt.addEventListener('keypress', function (e) {
            var code = e.keyCode || e.which;
            if (code === 13) {
                sendMessage();
            }
        });

        $sendBtn.addEventListener('click', function (e) {
            sendMessage();
            e.preventDefault();
        });
    }

    function sendMessage() {
        var msgValue = $msgTxt.value.trim();
        if (msgValue.length > 0) {
            if (viewModel.isInPrivateChat) {
                chatHub.invoke("sendPrivate", msgValue, viewModel.privateChatUser).catch(function (err) {
                    console.log('SendPrivate method failed: ' + err);
                });
            } else {
                chatHub.invoke("sendAll", msgValue).catch(function (err) {
                    console.log('Send method failed: ' + err);
                });
            }
        }
        $msgTxt.value = '';
        $msgTxt.focus();
    }

    function toggleInputs(status) {
        $sendBtn.disabled = status;
        $msgTxt.disabled = status;
    }

    $("#exitPrivateChat").click(function (e) {
        e.preventDefault(); // Evita a ação padrão do link
        viewModel.isInPrivateChat = false;
        viewModel.privateChatUser = null;
        hidePrivateChatInfo(); // Oculta a div privateChatInfo
        removePrivateChatUserStyle();
    });

    function updateMessages() {
        messagesElement.innerHTML = '';
        viewModel.messages.forEach(function (msg) {
            var li = document.createElement('li');
            var strong = document.createElement('strong');
            var fromSpan = document.createElement('span');
            fromSpan.textContent = msg.from + ': ';
            strong.appendChild(fromSpan);
            li.appendChild(strong);
            var messageSpan = document.createElement('span');
            messageSpan.textContent = msg.message;
            li.appendChild(messageSpan);
            if (msg.isPrivate) {
                var badge = document.createElement('span');
                badge.textContent = 'Privado';
                badge.classList.add('privateMessage');
                li.insertBefore(badge, li.firstChild); // Adiciona o span 'badge' como primeiro filho de 'li'
            }
            messagesElement.appendChild(li);
        });
    }

    function updateUsers() {
        usersElement.innerHTML = '';
        viewModel.users.forEach(function (user) {
            var li = document.createElement('li');
            li.textContent = user.name;
            li.addEventListener('click', function () {
                viewModel.privateChatUser = user.name;
                viewModel.isInPrivateChat = true;
                viewModel.users.forEach(function (u) {
                    u.isPrivateChatUser = (u.name === user.name);
                });
                // Atualizar a classe CSS dos elementos de usuário para refletir o estado de chat privado
                updateUsersStyle();
                showPrivateChatInfo(user.name);
            });
            if (user.isPrivateChatUser) {
                li.classList.add('privateChatUser');
            }
            usersElement.appendChild(li);
        });
    }

    // Função para atualizar a classe CSS dos elementos de usuário para refletir o estado de chat privado
    function updateUsersStyle() {
        var lis = usersElement.getElementsByTagName('li');
        for (var i = 0; i < lis.length; i++) {
            var user = viewModel.users[i];
            if (user.isPrivateChatUser) {
                lis[i].classList.add('privateChatUser');
            } else {
                lis[i].classList.remove('privateChatUser');
            }
        }
    }

    // Função para exibir a div privateChatInfo e preencher o nome do usuário com quem estamos em chat privado
    function showPrivateChatInfo(username) {
        var privateChatUserElement = document.getElementById('privateChatUser');
        privateChatUserElement.textContent = username;
        var privateChatInfoDiv = document.getElementById('privateChatInfo');
        privateChatInfoDiv.style.display = 'block';
    }

    // Função para ocultar a div privateChatInfo
    function hidePrivateChatInfo() {
        var privateChatInfoDiv = document.getElementById('privateChatInfo');
        privateChatInfoDiv.style.display = 'none';
    }

    // Função para remover o estilo CSS da lista de usuários quando sair do modo de mensagem privada
    function removePrivateChatUserStyle() {
        if (!viewModel.isInPrivateChat) {
            var lis = document.getElementById('users').getElementsByTagName('li');
            for (var i = 0; i < lis.length; i++) {
                lis[i].classList.remove('privateChatUser');
            }
        }
    }
});

