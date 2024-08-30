import React from 'react';
import { TitleBar, ResourcePicker } from '@shopify/app-bridge-react';


class DefaultTitleBar extends React.Component {
	state = { 
		productPickerOpen: false 
	};
	
	constructor(props) {
		super(props);
	}

	openProductPicker = () => {
		this.setState({ productPickerOpen: true });
	}

	closeProductPicker = () => {
		this.setState({ productPickerOpen: false });
	}

	render() {
		const primaryAction = this.props.primaryAction || {
			content: 'Select product',
			onAction: this.openProductPicker,
		};

		return (
			<React.Fragment>
				<TitleBar
					title={this.props.title}
					primaryAction={primaryAction}
					breadcrumbs={this.props.breadcrumbs}
				/>
				<ResourcePicker
					resourceType="Product"
					actionVerb="select"
					showVariants={false}
					selectMultiple={true}
					open={this.state.productPickerOpen}
					onSelection={this.handleSelection}
					onCancel={this.closeProductPicker}
				/>
			</React.Fragment>
		);
	}
	
	handleSelection = (resources) => {
		console.log(resources); 
	}
}

export default DefaultTitleBar;