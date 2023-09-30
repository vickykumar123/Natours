/* eslint-disable*/

import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.logout');
const updateUserData = document.querySelector('.form-user-data');
const updatePassword = document.querySelector('.form-user-settings');
const bookBtn = document.querySelector('#book-tour');

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (updateUserData)
  updateUserData.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(); //multipart/form-data
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    console.log(form);
    updateSettings(form, 'data');
  });

if (updatePassword) {
  updatePassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn-save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    ); // making await because to clear password field

    document.querySelector('.btn-save-password').textContent = 'Save password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
    // e.target.textContent = 'Book your Now!...';
  });
