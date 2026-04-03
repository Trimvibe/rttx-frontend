/**
 * SocketIOAwareness bridges the Yjs awareness protocol to our Socket.IO connection.
 * CollaborationCursor expects a "provider" object with an "awareness" property
 * that has getStates(), setLocalStateField(), on(), and off().
 * This class fakes that interface using Socket.IO events underneath.
 */
export class SocketIOAwareness {
  constructor(ydoc) {
    this.ydoc = ydoc;
    this.clientID = ydoc.clientID;
    this.states = new Map();
    this.states.set(this.clientID, {}); // start with empty local state
    this._handlers = {};
    this._socket = null;
  }

  // Called by useSocket once the socket is ready
  attachSocket(socket) {
    this._socket = socket;

    // Someone else moved their cursor / changed selection
    socket.on('awareness-update', ({ clientID, state }) => {
      const isNew = !this.states.has(clientID);
      this.states.set(clientID, state);
      this._emit('change', {
        added:   isNew ? [clientID] : [],
        updated: isNew ? [] : [clientID],
        removed: [],
      });
    });

    // A user disconnected — remove their cursor
    socket.on('awareness-remove', (clientID) => {
      this.states.delete(clientID);
      this._emit('change', { added: [], updated: [], removed: [clientID] });
    });
  }

  // Called by CollaborationCursor when our cursor/selection changes
  setLocalStateField(field, value) {
    const current = this.states.get(this.clientID) || {};
    const next = { ...current, [field]: value };
    this.states.set(this.clientID, next);
    this._socket?.emit('awareness-update', { clientID: this.clientID, state: next });
  }

  getLocalState() { return this.states.get(this.clientID) || null; }
  getStates()     { return this.states; }

  on(event, handler) {
    this._handlers[event] = this._handlers[event] || [];
    this._handlers[event].push(handler);
  }

  off(event, handler) {
    if (this._handlers[event]) {
      this._handlers[event] = this._handlers[event].filter(h => h !== handler);
    }
  }

  _emit(event, ...args) {
    (this._handlers[event] || []).forEach(h => h(...args, 'remote'));
  }

  destroy() {}
}
