import sequelize from '../config/sequelize.js';


// Common Models without accocications 

import Admin from './Admin.js';
import Role from './Role.js';

import ClientAccount from './ClientAccount.js';
import FirmClient from './FirmClient.js';


import LoginAttemptAdmin from './LoginAttemptAdmin.js';
import ActiveSessionAdmin from './ActiveSessionAdmin.js'

import LoginAttemptClient from './LoginAttemptClient.js'



import ActiveSessionClient from './ActiveSessionClient.js'




import OtpCode from './OtpCode.js'
import Notification from './Notification.js';
import Language from './Language.js';
import TandC from './TandC.js'; //TermsCondition
import PandP from './PandP.js'; //PrivacyPolicy
import FAQ from './FAQ.js'



import AuditLog from './AuditLog.js'
import Calendar from './Calendar.js';




// Finance , Payments related models
import Wallet from './Wallet.js';


// Admin Configs
import AdminSettings from './AdminSettings.js';
import Slider from './Slider.js';



import Location from './Location.js'

import AdminPasswordHistory from './AdminPasswordHistory.js'
import ClientPasswordHistory from './ClientPasswordHistory.js'


// ===== Chat (Universal WhatsApp-type) =====
import Conversation from './Conversation.js';
import ConversationParticipant from './ConversationParticipant.js';
import Message from './Message.js';
import MessageAttachment from './MessageAttachment.js';
import ChatBlock from './ChatBlock.js';



//========== Core Project related models 





import SSOIdentity from './SSOIdentity.js';



import Invoice from './Invoice.js';
import InvoiceItem from './InvoiceItem.js';


import TimeEntry from './TimeEntry.js';



import AIJob from './AIJob.js';

// Firm Plans and subscrition related 
import Plan from './Plan.js';

import PaymentMethod from './PaymentMethod.js'


import TicketThread from './TicketThread.js';
import TicketMessage from './TicketMessage.js';



import IntakeTemplate from './IntakeTemplate.js';
import IntakeTicket from './IntakeTicket.js';


//============ Associations Start ============================


// Add this after you import the models


// Role - Admin Associations
Role.hasMany(Admin, { foreignKey: 'role_id' });
Admin.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Admin.addScope('defaultScope', {
    include: [{
      association: Admin.associations.role,
      attributes: ['role_id', 'role_name', 'is_system', 'permissions', 'status'],
    }],
  }, { override: true });




// ---------- ORG / RBAC ----------




// Invoice items
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });


Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });




// ---------- NOTIFICATIONS ----------
Admin.hasMany(Notification, { foreignKey: 'admin_id' });
Notification.belongsTo(Admin, { foreignKey: 'admin_id' });




// ================== CHAT ASSOCIATIONS (Universal) ==================

// Conversation ↔ Participants
Conversation.hasMany(ConversationParticipant, {
  foreignKey: 'convo_id',
  as: 'participants',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

ConversationParticipant.belongsTo(Conversation, {
  foreignKey: 'convo_id',
  as: 'conversation',
});

// Conversation ↔ Messages
Conversation.hasMany(Message, {
  foreignKey: 'convo_id',
  as: 'messages',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Message.belongsTo(Conversation, {
  foreignKey: 'convo_id',
  as: 'conversation',
});

// ✅ (Optional but very useful) Conversation.last_message_id → Message
// Allows include: [{ model: Message, as: 'last_message' }]
Conversation.belongsTo(Message, {
  foreignKey: 'last_message_id',
  as: 'last_message',
  constraints: false, // keeps it safe if you don’t want strict FK constraint
});

// Message ↔ Attachments
Message.hasMany(MessageAttachment, {
  foreignKey: 'message_id',
  as: 'attachments',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

MessageAttachment.belongsTo(Message, {
  foreignKey: 'message_id',
  as: 'message',
});

// Reply-to (self reference)
Message.belongsTo(Message, {
  foreignKey: 'reply_to_message_id',
  as: 'reply_to',
  constraints: false,
});

// ChatBlock has no hard FK (polymorphic users), so no associations here.


// IntakeTemplate ↔ IntakeTicket
IntakeTemplate.hasMany(IntakeTicket, { foreignKey: 'template_id', as: 'tickets' });
IntakeTicket.belongsTo(IntakeTemplate, { foreignKey: 'template_id', as: 'template' });




// ================== END INTAKE ==================




export {
  sequelize,

  Admin,

  LoginAttemptAdmin,
  ActiveSessionAdmin,

  OtpCode,

  Notification,
  Language,
  Wallet,
  AdminSettings,
  TandC,
  PandP,
  FAQ,
  Slider,
  Calendar,



  Role,


  Location,
  ActiveSessionClient,
  LoginAttemptClient,
  AuditLog,
  AdminPasswordHistory,
  ClientPasswordHistory,
 
  
 SSOIdentity,

 Invoice, InvoiceItem,
 TimeEntry, AIJob,


 Plan,


PaymentMethod,



  TicketThread,
  TicketMessage,


    // Chat (Universal)
    Conversation,
    ConversationParticipant,
    Message,
    MessageAttachment,


    IntakeTemplate,
    IntakeTicket,

  ClientAccount,FirmClient,

ChatBlock

};
