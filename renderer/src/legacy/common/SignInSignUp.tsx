import React from 'react';
import store from '../redux/store';
import { useSelector } from 'react-redux';
import {
  setSignupError,
  setOpenSignup,
  setSignupLoading,
  setSignupFormData,
  setSigninError,
  setOpenSignin,
  setSigninLoading,
  setSigninFormData,
  setUser
} from '../redux/dataSlice';
import {
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { RootState } from '../redux/store';

const SignInSignUp: React.FC = () => {
  const openSignup = useSelector((state: RootState) => state.openSignup);
  const signupError = useSelector((state: RootState) => state.signupError);
  const signupFormData = useSelector((state: RootState) => state.signupFormData);
  const signupLoading = useSelector((state: RootState) => state.signupLoading);

  const openSignin = useSelector((state: RootState) => state.openSignin);
  const signinError = useSelector((state: RootState) => state.signinError);
  const signinFormData = useSelector((state: RootState) => state.signinFormData);
  const signinLoading = useSelector((state: RootState) => state.signinLoading);

  const handleOpenSignup = (): void => {
    store.dispatch(setOpenSignup(true));
    store.dispatch(setSignupError(null));
    store.dispatch(setSignupFormData({ username: '', email: '', password: '' }));
  };

  const handleCloseSignup = (): void => {
    store.dispatch(setOpenSignup(false));
    store.dispatch(setSignupError(null));
    store.dispatch(setSignupFormData({ username: '', email: '', password: '' }));
  };

  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    store.dispatch(setSignupFormData({ ...signupFormData, [name]: value }));
  };

  const handleOpenSignin = (): void => {
    store.dispatch(setOpenSignin(true));
    store.dispatch(setSigninError(null));
    store.dispatch(setSigninFormData({ username: '', password: '' }));
  };

  const handleCloseSignin = (): void => {
    store.dispatch(setOpenSignin(false));
    store.dispatch(setSigninError(null));
    store.dispatch(setSigninFormData({ username: '', password: '' }));
  };

  const handleSigninInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    store.dispatch(setSigninFormData({ ...signinFormData, [name]: value }));
  };

  const handleSignup = async (): Promise<void> => {
    store.dispatch(setSignupError(null));
    store.dispatch(setSignupLoading(true));

    try {
      const response = await fetch(
        'https://kaskade-backend-483052428154.asia-east1.run.app/signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(signupFormData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sign up failed');
      }

      // 注册成功
      console.log('Sign up successful', result);
      handleCloseSignup();
      // 可以在这里添加成功提示或自动登录逻辑
    } catch (err) {
      store.dispatch(setSignupError(err instanceof Error ? err.message : 'Sign up failed, retry'));
    } finally {
      store.dispatch(setSignupLoading(false));
    }
  };

  const handleSignin = async (): Promise<void> => {
    store.dispatch(setSigninError(null));
    store.dispatch(setSigninLoading(true));

    try {
      const response = await fetch(
        'https://kaskade-backend-483052428154.asia-east1.run.app/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(signinFormData),
          credentials: 'include'
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sign in failed');
      }

      // 登陆成功
      store.dispatch(setUser(result));
      handleCloseSignin();
      // 可以在这里添加成功提示或自动登录逻辑
    } catch (err) {
      store.dispatch(setSigninError(err instanceof Error ? err.message : 'Sign in failed, retry'));
    } finally {
      store.dispatch(setSigninLoading(false));
    }
  };

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ marginLeft: 'auto' }}>
        <Button variant="contained" color="primary" onClick={handleOpenSignup}>
          Sign Up
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleOpenSignin}>
          Sign In
        </Button>
      </Stack>

      <Dialog open={openSignup} onClose={handleCloseSignup} maxWidth="sm" fullWidth>
        <DialogTitle>Sign Up</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {signupError && <Alert severity="error">{signupError}</Alert>}
            <TextField
              name="username"
              label="Username"
              fullWidth
              value={signupFormData.username}
              onChange={handleSignupInputChange}
              required
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={signupFormData.email}
              onChange={handleSignupInputChange}
              required
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              fullWidth
              value={signupFormData.password}
              onChange={handleSignupInputChange}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSignup}>Cancel</Button>
          <Button
            onClick={handleSignup}
            variant="contained"
            disabled={
              signupLoading ||
              !signupFormData.username ||
              !signupFormData.email ||
              !signupFormData.password
            }
          >
            {signupLoading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* 下面是sign in的dialog */}
      <Dialog open={openSignin} onClose={handleCloseSignin} maxWidth="sm" fullWidth>
        <DialogTitle>Sign In</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {signinError && <Alert severity="error">{signinError}</Alert>}
            <TextField
              name="username"
              label="Username"
              fullWidth
              value={signinFormData.username}
              onChange={handleSigninInputChange}
              required
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              fullWidth
              value={signinFormData.password}
              onChange={handleSigninInputChange}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSignin}>Cancel</Button>
          <Button
            onClick={handleSignin}
            variant="contained"
            disabled={signinLoading || !signinFormData.username || !signinFormData.password}
          >
            {signinLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SignInSignUp;
