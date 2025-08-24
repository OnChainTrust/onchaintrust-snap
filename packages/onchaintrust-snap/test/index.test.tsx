import { installSnap } from '@metamask/snaps-jest';
import { Box, Banner, Text, Address, Row, Value, Divider } from '@metamask/snaps-sdk/jsx';

describe('onTransaction handler tests (JSX UI, live server)', () => {
  // Addresses from exampleResponse
  const VERIFIED_ADDRESS = '0x00000000000000000000000000000000f0cacc1a';
  const NOT_VERIFIED_ADDRESS = '0x00000000000000000000000000000000baadf00d';
  const NO_INFORMATION_ADDRESS = '0x00000000000000000000000000000000deadbeef';
  const MALICIOUS_ADDRESS = '0x00000000000000000000000000000000f00dbabe';
  const WHITELISTED_ADDRESS = '0x000000000000000000000000000000001abe11ed';
  const NOT_WHITELISTED_ADDRESS = '0x0000000000000000000000000000000000b0bbed';
  const KILL_SWITCH_ADDRESS = '0x00000000000000000000000000000000000c0c0a';

  const ORIGIN = 'https://example.com';

  it('NO_INFORMATION_ADDRESS → Unknown banner (warning) + message', async () => {
    const snap: any = await installSnap();
    const response = await snap.onTransaction({ to: NO_INFORMATION_ADDRESS, origin: ORIGIN });
    const screen = response.getInterface();

    expect(screen).toRender(
      <Box>
        {[
          <Banner key={"el-0"} title={"Unknown address"} severity={"warning"}>
            {[
              <Text key={"el-0-banner-0"}>No information found for this address</Text>
            ]}
          </Banner>
        ]}
      </Box>,
    );

    expect(response.response.result.severity).toBeUndefined();
  });

  it('VERIFIED_ADDRESS → verified banner present + details rows', async () => {
    const snap: any = await installSnap();
    const response = await snap.onTransaction({ to: VERIFIED_ADDRESS, origin: ORIGIN });
    const screen = response.getInterface();

    expect(screen).toRender(
      <Box>
        <Box center={false} direction="horizontal" key="el-0">
          {[
            <Address key="el-0-child-1" address="0x00000000000000000000000000000000f0cacc1a" avatar={true} displayName={true} truncate={false} />
          ]}
        </Box>
        <Banner key="el-1" severity="success" title="Verified address">
          {[
            <Text key="el-1-banner-0">
              This address owner passed the verification.
            </Text>
          ]}
        </Banner>
        <Divider />
        <Box key="el-3" center={false} direction="vertical">
          <Row key="el-3-child-0" label="Name">
            <Value key="el-3-child-0-child-0" extra="" value="Example Corp LTD" />
          </Row>
          <Row key="el-3-child-1" label="LEI">
            <Value key="el-3-child-1-child-0" extra="" value="1234567890" />
          </Row>
          <Row key="el-3-child-2" label="Email">
            <Value key="el-3-child-2-child-0" extra="" value="example@example.com" />
          </Row>
          <Row key="el-3-child-3" label="Message">
            <Value key="el-3-child-3-child-0" extra="" value="Hello there" />
          </Row>
        </Box>
      </Box>
    );

    expect(response.response.result.severity).toBeUndefined();
  });

  it('NOT_VERIFIED_ADDRESS → unverified banner present + details rows', async () => {
    const snap: any = await installSnap();
    const response = await snap.onTransaction({ to: NOT_VERIFIED_ADDRESS, origin: ORIGIN });
    const screen = response.getInterface();

    expect(screen).toRender(
      <Box>
        <Box key="el-0" center={false} direction="horizontal">
          {[
            <Address key="el-0-child-1" address="0x00000000000000000000000000000000baadf00d" avatar={true} displayName={true} truncate={false} />
          ]}
        </Box>
        <Banner key="el-1" severity="warning" title="Unverified address">
          {[
            <Text key="el-1-banner-0">
              Information provided by the owner was not verified. Make sure you trust this address.
            </Text>
          ]}
        </Banner>
        <Divider />
        <Box key="el-3" center={false} direction="vertical">
          <Row key="el-3-child-0" label="Name">
            <Value key="el-3-child-0-child-0" extra="" value="Example Corp LTD" />
          </Row>
          <Row key="el-3-child-1" label="LEI">
            <Value key="el-3-child-1-child-0" extra="" value="1234567890" />
          </Row>
          <Row key="el-3-child-2" label="Email">
            <Value key="el-3-child-2-child-0" extra="" value="example@example.com" />
          </Row>
          <Row key="el-3-child-3" label="Message">
            <Value key="el-3-child-3-child-0" extra="" value="Hello there" />
          </Row>
        </Box>
      </Box>
    );

    expect(response.response.result.severity).toBeUndefined();
  });

  it('WHITELISTED_ADDRESS → whitelisted banner with text + details', async () => {
    const snap: any = await installSnap();
    const response = await snap.onTransaction({ to: WHITELISTED_ADDRESS, origin: ORIGIN });
    const screen = response.getInterface();

    expect(screen).toRender(
      <Box>
        <Box key="el-0" center={false} direction="horizontal">
          {[
            <Address key="el-0-child-1" address="0x000000000000000000000000000000001abe11ed" avatar={true} displayName={true} truncate={false} />
          ]}
        </Box>
        <Banner key="el-1" severity="success" title="Verified address">
          {[
            <Text key="el-1-banner-0">
              This address owner passed the verification.
            </Text>
          ]}
        </Banner>
        <Divider />
        <Banner key="el-3" severity="success" title="Whitelisted">
          {[
            <Text key="el-3-banner-0">
              This address is explicitly whitelisted to be used on onchaintrust.org
            </Text>
          ]}
        </Banner>
        <Divider />
        <Box key="el-5" center={false} direction="vertical">
          <Row key="el-5-child-0" label="Name">
            <Value key="el-5-child-0-child-0" extra="" value="Example Corp LTD" />
          </Row>
          <Row key="el-5-child-1" label="LEI">
            <Value key="el-5-child-1-child-0" extra="" value="1234567890" />
          </Row>
          <Row key="el-5-child-2" label="Email">
            <Value key="el-5-child-2-child-0" extra="" value="example@example.com" />
          </Row>
          <Row key="el-5-child-3" label="Message">
            <Value key="el-5-child-3-child-0" extra="" value="Hello there" />
          </Row>
        </Box>
      </Box>
    );

    expect(response.response.result.severity).toBeUndefined();
  });

  it('NOT_WHITELISTED_ADDRESS → danger banner + severity=critical', async () => {
    const snap: any = await installSnap();
    const response = await snap.onTransaction({ to: NOT_WHITELISTED_ADDRESS, origin: ORIGIN });
    const screen = response.getInterface();

    expect(screen).toRender(
      <Box>
        <Box key="el-0" center={false} direction="horizontal">
          {[
            <Address key="el-0-child-1" address="0x0000000000000000000000000000000000b0bbed" avatar={true} displayName={true} truncate={false} />
          ]}
        </Box>
        <Banner key="el-1" severity="success" title="Verified address">
          {[
            <Text key="el-1-banner-0">
              This address owner passed the verification.
            </Text>
          ]}
        </Banner>
        <Divider />
        <Banner key="el-3" severity="danger" title="Not whitelisted">
          {[
            <Text key="el-3-banner-0">
              This address is not whitelisted to be used on onchaintrust.org
            </Text>
          ]}
        </Banner>
        <Divider />
        <Box key="el-5" center={false} direction="vertical">
          <Row key="el-5-child-0" label="Name">
            <Value key="el-5-child-0-child-0" extra="" value="Another Corp LTD" />
          </Row>
          <Row key="el-5-child-1" label="LEI">
            <Value key="el-5-child-1-child-0" extra="" value="9876543210" />
          </Row>
          <Row key="el-5-child-2" label="Email">
            <Value key="el-5-child-2-child-0" extra="" value="another@example.com" />
          </Row>
          <Row key="el-5-child-3" label="Message">
            <Value key="el-5-child-3-child-0" extra="" value="Another Message" />
          </Row>
        </Box>
      </Box>
    );

    expect(response.response.result.severity).toBe('critical');
  });

  it('KILL_SWITCH_ADDRESS → danger banner + severity=critical', async () => {
    const snap: any = await installSnap();
    const response = await snap.onTransaction({ to: KILL_SWITCH_ADDRESS, origin: ORIGIN });
    const screen = response.getInterface();

    expect(screen).toRender(
      <Box>
        {[
          <Banner
            key="el-0"
            title="The Owner of the Website deactivated all smart contract interactions"
            severity="danger"
          >
            {[
              <Text key="el-0-banner-0">
                Message from the Website Owner: The website is under attack. Please do not use it until further notice.
              </Text>
            ]}
          </Banner>
        ]}
      </Box>,
    );

    expect(response.response.result.severity).toBe('critical');
  });

  it('MALICIOUS_ADDRESS → security alert (danger) + severity=critical', async () => {
    const snap: any = await installSnap();
    const response = await snap.onTransaction({ to: MALICIOUS_ADDRESS, origin: ORIGIN });
    const screen = response.getInterface();

    expect(screen).toRender(
      <Box>
        {[
          <Banner key="el-0" title="Security Alert: Potentially Unsafe Action Detected!" severity="danger">
            {[
              <Text key="el-0-banner-0">
                STOP: Your transaction is directed towards an address that has been flagged for suspicious activity. Engaging with this address may result in the loss of your digital assets or compromise your personal security.
              </Text>
            ]}
          </Banner>
        ]}
      </Box>,
    );

    expect(response.response.result.severity).toBe('critical');
  });
});
