import React, { useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { User } from '../model';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { setOpenProfile, setUser } from '../redux/dataSlice';
import store from '../redux/store';

const UserInfo: React.FC<User> = ({ username, email }) => {
  const user = useSelector((state: RootState) => state.user);
  const openProfile = useSelector((state: RootState) => state.openProfile);

  const [profileForm, setProfileForm] = useState({
    username: user?.username ?? username ?? '',
    email: user?.email ?? email ?? '',
    currentpassword: '',
    newpassword: '',
    retypenewpassword: ''
  });
  const [isUsernameEditable, setIsUsernameEditable] = useState(false);
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [modifyPassword, setModifyPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const [changeInfoError, setChangeInfoError] = useState('');
  // useEffect(() => {
  //   // if (!isUsernameEditable) {
  //   //   setProfileForm((prev) => ({
  //   //     ...prev,
  //   //     username: user?.username ?? username ?? ''
  //   //   }));
  //   // }
  // }, [user, username, isUsernameEditable]);

  const handleOpenProfile = (): void => {
    store.dispatch(setOpenProfile(true));
  };

  const handleCloseProfile = (): void => {
    store.dispatch(setOpenProfile(false));
    setIsUsernameEditable(false);
    setIsEmailEditable(false);
    setChangeInfoError('');
    setModifyPassword(false);
    setProfileForm((prev) => ({ ...prev, newpassword: '', retypenewpassword: '' }));
  };

  const handleModifyPassword = (): void => {
    setModifyPassword((prev) => !prev);
    setProfileForm((prev) => ({
      ...prev,
      currentpassword: '',
      newpassword: '',
      retypenewpassword: ''
    }));
  };

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleUsernameEditable = (): void => {
    setIsUsernameEditable((prev) => !prev);
    setTimeout(() => usernameInputRef.current?.focus(), 0);
  };
  const toggleEmailEditable = (): void => {
    setIsEmailEditable((prev) => !prev);
    setTimeout(() => emailInputRef.current?.focus(), 0);
  };

  const handleLogOut = async (): Promise<void> => {
    try {
      const response = await fetch(
        'https://kaskade-backend-483052428154.asia-east1.run.app/logout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Log out failed');
      }
    } catch (err) {
      console.log(err);
    } finally {
      store.dispatch(setUser(null));
    }
  };

  const handleSubmit = async (): Promise<void> => {
    setSubmitLoading(true);

    try {
      const response = await fetch(
        `https://kaskade-backend-483052428154.asia-east1.run.app/users/${user?.username}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(profileForm),
          credentials: 'include'
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Modify User failed');
      }

      // 修改用户信息成功，更新 Redux store 中的 user
      if (user) {
        store.dispatch(
          setUser({
            username: profileForm.username,
            email: profileForm.email
          })
        );
      }
      handleCloseProfile();
    } catch (err) {
      setChangeInfoError(err instanceof Error ? err.message : 'Modify User failed, retry');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Stack direction="row" spacing={2} sx={{ marginLeft: 'auto' }}>
      <Typography variant="body1">Hello, {username}</Typography>
      <Link
        component="button"
        type="button"
        variant="body1"
        underline="hover"
        onClick={handleOpenProfile}
        sx={{ p: 0, alignSelf: 'center' }}
      >
        Profile
      </Link>
      <Link
        component="button"
        type="button"
        variant="body1"
        underline="hover"
        onClick={handleLogOut}
        sx={{ p: 0, alignSelf: 'center' }}
      >
        Log Out
      </Link>

      <Dialog open={openProfile} onClose={handleCloseProfile} maxWidth="sm" fullWidth>
        <DialogTitle>User Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {changeInfoError && <Alert severity="error">{changeInfoError}</Alert>}
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                name="username"
                label="Username"
                fullWidth
                value={profileForm.username}
                onChange={handleProfileInputChange}
                disabled={!isUsernameEditable}
                inputRef={usernameInputRef}
              />
              <Tooltip title={isUsernameEditable ? '锁定' : '编辑'}>
                <IconButton
                  color={isUsernameEditable ? 'success' : 'default'}
                  onClick={toggleUsernameEditable}
                  size="small"
                >
                  {isUsernameEditable ? (
                    <CheckIcon fontSize="small" />
                  ) : (
                    <EditIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                name="email"
                label="Email"
                fullWidth
                value={profileForm.email}
                onChange={handleProfileInputChange}
                disabled={!isEmailEditable}
                inputRef={emailInputRef}
              />
              <Tooltip title={isEmailEditable ? '锁定' : '编辑'}>
                <IconButton
                  color={isEmailEditable ? 'success' : 'default'}
                  onClick={toggleEmailEditable}
                  size="small"
                >
                  {isEmailEditable ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Stack>
            {modifyPassword ? (
              <>
                <TextField
                  name="currentpassword"
                  label="Current Password"
                  type="password"
                  fullWidth
                  value={profileForm.currentpassword}
                  onChange={handleProfileInputChange}
                />
                <TextField
                  name="newpassword"
                  label="New Password"
                  type="password"
                  fullWidth
                  value={profileForm.newpassword}
                  onChange={handleProfileInputChange}
                />
                <TextField
                  name="retypenewpassword"
                  label="Retype New Password"
                  type="password"
                  fullWidth
                  value={profileForm.retypenewpassword}
                  onChange={handleProfileInputChange}
                />
                {profileForm.newpassword !== profileForm.retypenewpassword && (
                  <Alert severity="error">Password Mismatch</Alert>
                )}

                <Link
                  component="button"
                  type="button"
                  variant="body1"
                  underline="hover"
                  onClick={handleModifyPassword}
                  sx={{ p: 0, alignSelf: 'center' }}
                >
                  Close
                </Link>
              </>
            ) : (
              <Link
                component="button"
                type="button"
                variant="body1"
                underline="hover"
                onClick={handleModifyPassword}
                sx={{ p: 0, alignSelf: 'center' }}
              >
                Modify Password
              </Link>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit} variant="contained" disabled={submitLoading}>
            {submitLoading ? 'Submitting...' : 'Submit'}
          </Button>
          <Button onClick={handleCloseProfile}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default UserInfo;
