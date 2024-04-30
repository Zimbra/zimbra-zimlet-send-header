import { useDispatch, useSelector, batch } from 'react-redux';
import { useCallback, useEffect } from 'preact/hooks';
import { useText } from 'preact-i18n';
import { gql } from '@apollo/client';
import { withIntl } from '../enhancers';
import { zimletEventEmitter } from '@zimbra-client/util';
import { useSendMessageMutation, usePreferences } from '@zimbra-client/hooks';
import { ZIMBRA_ZIMLET_EVENTS } from '@zimbra-client/constants';
import { getMenuClicked } from '../store/selectors';
import { updateMenuClicked } from '../store/actions';

const prefsQuery = gql`
	query GetPrefEditingDetails {
		getPreferences {
			zimbraPrefMessageViewHtmlPreferred
		}
	}
`;

const SendCustomHeaderMessage = ({ notify, closeComposer, getMessageToSend }) => {
	const dispatch = useDispatch();
	const isOffline = useSelector(state => state.network.isOffline);
	const MenuClicked = useSelector(state => getMenuClicked(state));
	const { data } = usePreferences(prefsQuery, { fetchPolicy: 'cache-only' });
	const zimbraPrefMessageViewHtmlPreferred =
		data?.getPreferences?.zimbraPrefMessageViewHtmlPreferred;
	const sendMessageMutation = useSendMessageMutation({
		zimbraPrefMessageViewHtmlPreferred,
		isOffline
	});

	const { sentWithHeader, sendFail } = useText({
		sentWithHeader: 'sendHeader.sentWithHeader',
		sendFail: 'sendHeader.sendFail'
	});

	const onSendHeaderHandler = useCallback(
		({ onAfterSend }) => {
			const customHeaders = [
				{ name: 'X-Zimbra-App', _content: 'zimlet' },
				{ name: 'X-Zimbra-Type', _content: MenuClicked ? 'true' : 'false' }
			];
			const messageToSend = getMessageToSend();
			console.log('here MenuClicked: ', MenuClicked);
			if (MenuClicked) {
				messageToSend.header = customHeaders;
			}

			sendMessageMutation({ message: messageToSend, zimbraPrefMessageViewHtmlPreferred })
				.then(() => {
					!isOffline && closeComposer && closeComposer();
					onAfterSend && onAfterSend(true);
					batch(() => {
						dispatch(
							notify({
								message: sentWithHeader
							})
						);
						console.log('making it false');
						dispatch(updateMenuClicked(false));
					});
				})
				.catch(err => {
					onAfterSend && onAfterSend(false);
					console.error('Error in sending message with custom header', err);
					dispatch(
						notify({
							message: sendFail
						})
					);
				});
		},
		[
			MenuClicked,
			closeComposer,
			dispatch,
			getMessageToSend,
			isOffline,
			notify,
			sendFail,
			sendMessageMutation,
			sentWithHeader,
			zimbraPrefMessageViewHtmlPreferred
		]
	);

	useEffect(() => {
		zimletEventEmitter.on(ZIMBRA_ZIMLET_EVENTS.ONSEND, onSendHeaderHandler, true);
		return () => {
			zimletEventEmitter.off(ZIMBRA_ZIMLET_EVENTS.ONSEND, onSendHeaderHandler);
		};
	}, [dispatch, onSendHeaderHandler]);

	return null;
};

export default withIntl()(SendCustomHeaderMessage);
