module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const UserSchema = new Schema({
    email: { type: String, require: true },
    password: { type: String, require: true, select: false },
    nickname: { type: String, require: true },
    avatar: { type: String, require: false, default: '/user.png' },
    __v: { type: Number, select: false },
  }, {
    timestamps: true,
  })

  return mongoose.model('User', UserSchema)
}
