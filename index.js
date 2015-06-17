/* global gameUrls */
window.addEventListener('load', function onLoad() {
  'use strict';
  var w1 = new WebSocket(gameUrls.list);
  var response;
  var ul = document.querySelector('.existing-games');

  var playerId;
  var request2;
  var newGameButton = document.querySelector('.newGame');
  var createGameButton = document.querySelector('.createGame');
  var startGameDiv = document.querySelector('.startGame');
  var mainGameDiv = document.querySelector('.mainGame');
  var statusMEssage1 = startGameDiv.querySelector('.status-message');
  var statusMEssage2 = mainGameDiv.querySelector('.status-message');
  var myTurn = false;
  var request4;
  var request1;
  var yourid;
  var Player;
  var field = document.querySelector('.field');
  var request3;
  var request5;
  var parsedError;
  var winner;

  function polling(opposite) {
    var cellId;
    request4 = new XMLHttpRequest();
    request4.open('GET', gameUrls.move);
    // request4.setRequestHeader('Access-Control-Allow-Origin', '*');
    // request4.setRequestHeader('Content-Type', 'application/json');
    request4.setRequestHeader('Game-ID', yourid);
    request4.setRequestHeader('Player-ID', playerId);
    request4.send();
    request4.addEventListener('readystatechange', function longPolling(e) {
      if (e.target.readyState === 4) {
        if (e.target.status === 200) {
          cellId = JSON.parse(e.target.responseText).move;
          document.getElementById(cellId).classList.add(opposite);
          myTurn = true;
          winner = JSON.parse(e.target.responseText).win;
          if (winner) {
            newGameButton.innerHTML = 'Новая игра';
            statusMEssage2.innerHTML = winner;
            field.removeEventListener('click', clickAction);
          } else {
            forwardGame();
          }
        } else {
          polling(opposite);
        }
      }
    });
  }

  function forwardGame() {
    if (myTurn === true) {
      field.addEventListener('click', clickAction);
    } else {
      field.removeEventListener('click', clickAction);
      polling(Player === 'x' ? 'o' : 'x');
    }
  }

  function clickAction(event) {
    if (event.target.classList.contains('cell')) {
      if (!event.target.classList.contains('x') && !event.target.classList.contains('o')) {
        request3 = new XMLHttpRequest();
        request3.open('POST', gameUrls.move);
        request3.setRequestHeader('Content-Type', 'application/json');
        request3.setRequestHeader('Game-ID', yourid);
        request3.setRequestHeader('Player-ID', playerId);
        request3.send(JSON.stringify({move: event.target.id}));
        request3.addEventListener('readystatechange', function getResponse(resp) {
          if (resp.target.readyState === 4) {
            if (resp.target.status === 200) {
              event.target.classList.add(Player);
              myTurn = false;
              winner = JSON.parse(resp.target.responseText).win;
              if (winner) {
                newGameButton.innerHTML = 'Новая игра';
                statusMEssage2.innerHTML = winner;
                field.removeEventListener('click', clickAction);
              } else {
                forwardGame();
                polling(Player === 'x' ? 'o' : 'x');
              }
            } else {
              field.removeEventListener('click', clickAction);
              parsedError = JSON.parse(resp.target.responseText).message;
              if (parsedError) {
                statusMEssage2.innerHTML = parsedError;
              } else {
                statusMEssage2.innerHTML = 'Неизвестная ошибка';
              }
            }
          }
        });
      }
    }
  }

  function addCells(size) {
    // console.log(field)
    var id = 1;
    var rows;
    var row;
    var cells;
    var cell;
    for (rows = 0; rows < size; rows++) {
      row = document.createElement('div');
      row.classList.add('row');
      field.appendChild(row);
      for (cells = 0; cells < size; cells++) {
        cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = id;
        id = id + 1;
        row.appendChild(cell);
      }
    }
  }

  function addToUl(liElem) {
    ul.appendChild(liElem);
  }

  function removeFromUl(elemId) {
    ul.removeChild(document.getElementById(elemId));
  }


  function startGame(pId) {
    var data = {player: pId, game: yourid};
    statusMEssage1.innerHTML = 'Ожидаем начала игры';
    createGameButton.disabled = true;
    // console.log(data);
    request2 = new XMLHttpRequest();
    request2.open('POST', gameUrls.gameReady);
    request2.setRequestHeader('Content-Type', 'application/json');
    request2.send(JSON.stringify(data));
    request2.addEventListener('readystatechange', function getResponse(resp) {
      if (resp.target.readyState === 4) {
        if (resp.target.status === 200) {
          mainGameDiv.style.display = 'block';
          startGameDiv.style.display = 'none';
          Player = JSON.parse(resp.target.responseText).side;
          if (Player === 'x') {
            myTurn = true;
          }
          addCells(10);
          forwardGame();
        } else if (resp.target.status === 410) {
          statusMEssage1.innerHTML = 'Ошибка старта игры: другой игрок не ответил';
        } else {
          statusMEssage1.innerHTML = 'Неизвестная ошибка старта игры';
        }
      }
    });
  }

  function createLiElem(elemId) {
    var li = document.createElement('li');
    li.id = elemId;
    li.innerHTML = elemId;
    li.addEventListener('click', function Connect(e) {
      yourid = e.target.id;
      w1.send(JSON.stringify({register: e.target.id}));
    });
    return li;
  }

  function createGame() {
    createGameButton.disabled = true;
    request1 = new XMLHttpRequest();
    request1.open('POST', gameUrls.newGame);
    // request1.setRequestHeader('Content-Type', 'application/json');
    request1.send();
    request1.addEventListener('readystatechange', function getResponse(resp) {
      if (resp.target.readyState === 4) {
        if (resp.target.status === 200) {
          yourid = JSON.parse(resp.target.responseText).yourId;
          w1.send(JSON.stringify({register: yourid}));
        } else {
          createGameButton.disabled = false;
          statusMEssage1.innerHTML = 'Ошибка создания игры';
        }
      }
    });
  }

  w1.addEventListener('message', function wsMessage(e) {
    response = JSON.parse(e.data);
    if (response.action === 'add') {
      addToUl(createLiElem(response.id));
    }
    if (response.action === 'remove') {
      removeFromUl(response.id);
    }
    if (response.action === 'startGame') {
      playerId = response.id;
      // console.log('startgame:' + playerId);
      startGame(playerId);
    }
  });

  createGameButton.addEventListener('click', createGame);


  newGameButton.addEventListener('click', function newGameClick() {
    mainGameDiv.style.display = 'none';
    startGameDiv.style.display = 'block';
    request5 = new XMLHttpRequest();
    request5.open('PUT', gameUrls.surrender);
    request5.setRequestHeader('Game-ID', yourid);
    request5.setRequestHeader('Player-ID', playerId);
    request5.send();
    request5.addEventListener('readystatechange', function checkResp(e) {
      if (e.target.readyState === 4) {
        if (e.target.status === 200) {
          mainGameDiv.style.display = 'none';
          startGameDiv.style.display = 'block';
        } else {
          parsedError = JSON.parse(e.target.responseText).message;
          if (parsedError) {
            statusMEssage1.innerHTML = parsedError;
          } else {
            statusMEssage1.innerHTML = 'Неизвестная ошибка';
          }
        }
      }
    });
  });
});
