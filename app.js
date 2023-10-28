import OpenAI from 'openai'
import  { Client } from '@threadsjs/threads.js';
import colors from '@colors/colors'
// set theme
colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

import 'dotenv/config'

async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}
const threadsAPI = new Client();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_ACCESS_TOKEN,
  baseURL: 'https://api.pawan.krd/pai-001-light-beta/v1',
});
await threadsAPI.login(process.env.THREADS_USERNAME, process.env.THREADS_PASSWORD,);

  async function ThreadsGpt(){
    try {
      //get thread notifications
      let data = await threadsAPI.feeds.notifications("text_post_app_mentions");
      if (data&&data.new_stories) {
        for await (let notification of data.new_stories) {
          let mention = await notification.args
          let parentPostID = mention.destination.split('media?id=')[1]
          parentPostID = parentPostID.split('_' + mention.profile_id)[0]
          let post = await threadsAPI.posts.fetch(parentPostID);
          let caption = post.containing_thread.thread_items[0].post.caption.text
          const res = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages:[{
              role: 'user',
              content: `write a sarcastic short tweet to "${caption}" with relevant emojis`,
            }]
          });
          const response = res.choices[0].message.content
          console.log(response);


          //reply to thread
          await threadsAPI.posts.reply(mention.profile_id,{
            contents: response,
            post: parentPostID,
          });

          console.log(colors.info(`Replied to post: ${parentPostID}`))

          //delay for 4 minute
          await sleep(240000);
        }
        ///mark notifications as seen
        await threadsAPI.feeds.notificationseen()


        //delay for  4 minute
        await sleep(240000);
        await ThreadsGpt()
      }else{
        await sleep(240000);
        await ThreadsGpt()
      }

    } catch (e) {
      console.error(`error: ` + e)
      await sleep(240000);
      await ThreadsGpt()
    }
  }
  ThreadsGpt();

