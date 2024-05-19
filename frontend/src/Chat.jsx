import * as React from 'react';
import { useState, useEffect, useRef, Fragment } from 'react';
import Paper from '@mui/material/Paper';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import Divider from '@mui/material/Divider';
import ListItemButton from '@mui/material/ListItemButton';
import Grid from '@mui/material/Unstable_Grid2';

const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const [byteCount, setByteCount] = useState(0);

  const [clientId, setClientId] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);
  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3010');

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (event) => {
      console.log(event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.userId) {
          setClientId(data.userId);
        }
        else if (typeof data.onlineCount === 'number') {
          setOnlineCount(data.onlineCount);
        }
        else if (data.createMessage) {
          const createdMessages = data.createMessage.map(msg => ({
            id: msg.id,
            properties: msg.properties
          }));
          setMessages(prevMessages => [...prevMessages, ...createdMessages]);
        }
      }
      catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setOnlineCount(0);
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const listRef = useRef(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  });

  const handleSend = () => {
    if (byteCount > 256 || inputValue.trim() === '') {
      return;
    }
  
    const message = JSON.stringify({ userId: clientId, message: inputValue });
    ws.current.send(message);
    setInputValue('');
    setByteCount(0);
    
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    setByteCount(new Blob([value]).size);
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-UK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-UK', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={24}
        style={{
          width: 'min(100vh, 100vw)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1 }}
            >
              Live Chat
            </Typography>
            <Typography
              variant="body1"
              component="div"
              sx={{ textAlign: 'right' }}
            >
              Users online: {onlineCount}
            </Typography>
          </Toolbar>
        </AppBar>
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {
            messages
              .sort((a, b) => {
                const dateA = new Date(a.properties.time);
                const dateB = new Date(b.properties.time);
                return dateA - dateB;
              })
              .reduce((acc, message, index, array) => {
                const currentDate = formatDate(message.properties.time);
                const prevMessage = index > 0 ? array[index - 1] : null;
                const prevDate = prevMessage ?
                  formatDate(prevMessage.properties.time) : null;
                const showDivider = prevDate !== currentDate;
                let showProfile = true;
                if (
                  !showDivider &&
                  prevMessage &&
                  prevMessage.properties.userId === message.properties.userId &&
                  Math.abs(
                    new Date(prevMessage.properties.time) -
                    new Date(message.properties.time),
                  ) < 600000
                ) {
                  showProfile = false;
                }
                acc.push(
                  <Fragment key={index}>
                    {showDivider && (
                      <Divider sx={{ my: 1 }}>
                        <Typography variant="caption">
                          {currentDate}
                        </Typography>
                      </Divider>
                    )}
                    <ListItemButton key={index}>
                      <Grid
                        container
                        spacing={0}
                        sx={{
                          width: '100%',
                        }}
                      >
                        {showProfile && (
                          <Grid
                            container
                            spacing={0}
                            sx={{
                              width: '100%',
                            }}
                          >
                            <Grid sx={{ width: '80%' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {message.properties.userId}
                              </Typography>
                            </Grid>
                            <Grid
                              sx={{
                                width: '20%',
                                textAlign: 'right'
                              }}
                            >
                              <Typography variant="caption">
                                {formatTime(message.properties.time)}
                              </Typography>
                            </Grid>
                          </Grid>
                        )}
                        <Grid
                          sx={{
                            width: '100%',
                          }}
                        >
                          <Typography
                            variant="body2"
                            style={{
                              whiteSpace: 'pre-line',
                              wordWrap: 'break-word',
                            }}
                          >
                            {message.properties.message}
                          </Typography>
                        </Grid>
                      </Grid>
                    </ListItemButton>
                  </Fragment>
                );
                return acc;
              }, [])
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px' }}>
          <OutlinedInput
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            multiline
            maxRows={6}
            size="small"
            placeholder="Enter your text..."
            sx={{
              flexGrow: 1,
              '& input': {
                fontSize: 'body1.fontSize',
              },
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 0 0 8px',
            width: 'calc(100% - 8px)',
          }}
        >
          <Typography
            variant="body1"
            display="block"
            sx={{ color: byteCount > 256 ? 'red' : 'inherit' }}
          >
            {byteCount} / 256
          </Typography>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            sx={{
              marginLeft: 'auto',
            }}
            onClick={handleSend}
          >
            <SendIcon />
          </IconButton>
        </div>
      </Paper>
    </div>
  );
};

export default Chat;
