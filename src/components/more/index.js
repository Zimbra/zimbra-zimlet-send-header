import { createElement } from 'preact';
import { useCallback } from 'preact/hooks';
import { useDispatch } from 'react-redux';
import { Text } from 'preact-i18n';
import { ActionMenuItem } from '@zimbra-client/components';
import { withIntl } from '../../enhancers';
import { updateMenuClicked } from '../../store/actions';

const CreateMore = ({ context }) => {
	const dispatch = useDispatch();
	console.log(context);

	const menuClickHandler = useCallback(() => {
		console.log("making it true");
		dispatch(updateMenuClicked(true));
	}, [dispatch]);

	return (
		<ActionMenuItem onClick={menuClickHandler}>
			<Text id="sendHeader.menu" />
		</ActionMenuItem>
	);
};

export default withIntl()(CreateMore);
