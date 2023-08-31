import { ChatGPTUnofficialProxyAPI } from 'chatgpt'
import  Threads  from 'threads-api';
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

  async function ThreadsGpt(){
    try {
      const {ThreadsAPI} = Threads;
      const api = new ChatGPTUnofficialProxyAPI({
        accessToken: process.env.OPENAI_ACCESS_TOKEN,
        apiReverseProxyUrl: 'https://ai.fakeopen.com/api/conversation'
      })
      const threadsAPI = new ThreadsAPI({
        username: process.env.THREADS_USERNAME,
        password: process.env.THREADS_PASSWORD,
      });
      //get thread notifications
      let data = await threadsAPI.getNotifications();
      if (!data.is_last_page) {
        const cursor = data.next_max_id;
        data = await threadsAPI.getNotifications(ThreadsAPI.NotificationFilter, cursor);
      }

      if (data&&data.new_stories) {
        for await (let notification of data.new_stories) {
          let mention = await notification.args
          if (mention.extra.context==='Mentioned you') {
            let parentPostID = mention.destination.split('media?id=')[1]
            parentPostID = parentPostID.split('_' + mention.profile_id)[0]
            let post = await threadsAPI.getThreads(parentPostID);
            let caption =post.containing_thread.thread_items[0].post.caption.text
            const res = await api.sendMessage(`write a sarcastic joke to "${caption}" in plain text`)
            const response = res.text


            //reply to thread
            await threadsAPI.publish({
              text: response,
              parentPostID: parentPostID,
            });

            console.log(colors.info(`Replied to post: ${parentPostID}`) )

            //delay for 4 minute
            await sleep(240000);
          }
        }
        ///mark notifications as seen
        await threadsAPI.setNotificationsSeen()


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

