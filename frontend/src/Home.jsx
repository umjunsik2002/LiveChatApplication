import * as React from 'react';
import {useNavigate} from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const Home = () => {
  const history = useNavigate();
  
  const handleButtonClick = () => {
    history('/chat');
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
      <Box
        p={2}
        width="calc(100vw - 48px)"
        maxWidth="calc(100vh - 48px)"
        height="calc(100vh - 48px)"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        sx={{
          // border: '2px solid grey',
        }}
      >
        <div 
          style={{
            maxHeight: 'calc(100vh - 48px)',
            overflowY: 'auto',
          }}
        >
          <Typography variant="h5" gutterBottom>
            Welcome to the Live Chat Application!
          </Typography>
          <br />
          <Typography variant="body1" gutterBottom>
            This is the web application which live users can chat in real time.
          </Typography>
          <Typography variant="body1" gutterBottom>
            This application is created with Node.js with React MUI frontend and Node.js Express/web socket library for backend with PostgreSQL database.
          </Typography>
          <Typography variant="body1" gutterBottom>
            The chat data is deleted every 24 hours to save the resource. I am not responsible for any inappropriate activities in the chat, but please be nice to each other!
          </Typography>
          <Typography variant="body1" gutterBottom>
            Click the START button to start the chat. 
          </Typography>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button 
            variant="contained"
            color="primary"
            sx={{
              marginTop: 'auto',
              width: 240,
            }}
            onClick={handleButtonClick}
          >
            Start
          </Button>
        </div>
      </Box>
    </div>
  );
};

export default Home;
