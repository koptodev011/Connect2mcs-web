export interface Conversation {
  name: string;
  mandal?: string;
  group?: boolean;
  last: string;
  when: string;
  unread: number;
  online: boolean;
  active?: boolean;
}

export interface Message {
  from: 'me' | 'them';
  text: string;
  at: string;
}

export const conversations: Conversation[] = [
  { name: 'Madhura Phadke',  mandal: 'Sydney MM',  last: 'Sounds great — Saturday 9:30 works.',          when: '2m',  unread: 0, online: true,  active: true },
  { name: 'Rohan Bhave',     mandal: 'Seattle MM', last: 'Sent you the system design notes.',             when: '14m', unread: 2, online: true               },
  { name: 'Boston MM Group', group: true,          last: 'Anuja: Anyone going to the food festival?',    when: '1h',  unread: 5, online: false              },
  { name: 'Snehal Joshi',    mandal: 'Toronto MM', last: 'Loved the Bharatanatyam clip!',                 when: '3h',  unread: 0, online: false              },
  { name: 'Mihir Apte',      mandal: 'Mumbai MM',  last: 'Yes, the next chapter is ready for review.',   when: '1d',  unread: 0, online: false              },
  { name: 'Sai Karve',       mandal: 'London MM',  last: 'Catering for Gudhi Padwa — count me in.',      when: '2d',  unread: 0, online: false              },
  { name: 'Ananya Deshmukh', mandal: 'BMM Pune',   last: 'Coffee chat next week?',                       when: '4d',  unread: 0, online: false              },
];

export const chatThread: Message[] = [
  { from: 'them', text: 'Hi Anuja! Got time on Saturday for a quick portfolio chat?',                                            at: 'Yesterday · 8:42 pm' },
  { from: 'me',   text: 'Yes! 9:30 am Boston time works for me. Should I send across the Razorpay redesign?',                  at: 'Yesterday · 9:11 pm' },
  { from: 'them', text: 'Perfect. Send the Figma link and a 2-line context. We\'ll go through it on the call.',                at: 'Today · 7:14 am'     },
  { from: 'them', text: 'Also — congrats on the design lead role! 🎉',                                                         at: 'Today · 7:14 am'     },
  { from: 'me',   text: 'Thank you so much!! Will share the link by EOD. ',                                                    at: 'Today · 9:02 am'     },
  { from: 'them', text: 'Sounds great — Saturday 9:30 works.',                                                                 at: 'Today · 9:08 am'     },
];
