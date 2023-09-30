import { showAlert } from './alert';

/* eslint-disable */
// type may be password or data
export const updateSettings = async (data, type) => {
  console.log(name, email);
  try {
    const url =
      type === 'password'
        ? // ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
          '/api/v1/users/updateMyPassword'
        : // : 'http://127.0.0.1:3000/api/v1/users/updateMe';
          '/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `Successfully updated ${type.toUpperCase()}`);
      //   location.reload(true);
    }

    console.log(res);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
