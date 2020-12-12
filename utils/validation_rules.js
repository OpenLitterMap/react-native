const validation_rules = {
  /* Must prefix messages with ^ */
  email: {
    presence: {
      message: '^Please enter your email'
    },
    // email: {
    //   message: '^Please enter a valid email'
    // },
    format: {
        pattern: /^\S+@\S+$/,
        message: '^Please enter a valid email'
    }
  },

  password: {
    presence: {
      message: '^Please enter a password'
    },
    length: {
      minimum: 5,
      message: '^Your password must be at least 6 characters'
    },
    // format: {
    //   pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[\w~@#$%^&+=`|{}:;!.?\""()\[\]-]{5,}$/,
    //   flags: 'i',
    //   message:
    //     '^Must contain a capital, lowercase, number and a special character!'
    // }
  }
};

export default validation_rules;
