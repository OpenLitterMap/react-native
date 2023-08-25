import {produce} from 'immer';

const INITIAL_STATE = {
    paginated: {
        users: []
    }
};

export default function (state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            case 'UPDATE_LEADERBOARDS':
                draft.paginated = action.payload;

                break;

            default:
                return draft;
        }
    });
}
